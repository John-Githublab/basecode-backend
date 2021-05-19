let request = require('request');
let mongoose = require('mongoose');
var CryptoJS = require('crypto-js');
const User = require('./../../models/User');
const DataFileUpload = require('./../../models/DataFileUpload');
const Tag = require('./../../models/Tag');

const configuration = require('./../../../config/configuration');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
const returnCode = require('./../../../config/responseCode').returnCode;

var passwordSecretKey = 'Vaxi@2O$1'; // (pimarq)this is standerd key to generate password
const NodeCache = require('node-cache');

const systemCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: configuration.login.otpValidation,
});

module.exports = {
  accountLoginStatus: async function (req, res, next) {
    try {
      let responseCode = returnCode.invalidSession;
      let userType = '';
      let user, receiverId;
      let notificationCount = 0;

      if (!UtilController.isEmpty(req.session.userId)) {
        responseCode = returnCode.validSession;
        receiverId = req.session.userId;
        if (!UtilController.isEmpty(req.query.fcmToken)) {
          await User.findByIdAndUpdate(req.session.userId, {
            fcmToken: req.query.fcmToken,
          });
        }
        user = await User.findById(req.session.userId)
          .select(
            'fname lname email mobileNo userName profileImage userType permission deliveryAddress gender dob'
          )
          .populate('permission')
          .lean();
        //         notificationCount = await Notification.countDocuments({
        //   receiverId,
        //   read: false
        // });
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode,
        user,
        notificationCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  accountLogin: async function (req, res, next) {
    try {
      let userCode = returnCode.validEmail;
      let userType = 'user';
      let emailId = req.body.email;
      let userName = req.body.email;
      let password = req.body.password;

      // check the email, only emap
      if (!UtilController.isEmpty(userName)) {
        userName = userName.trim();
        let emailCheck = await User.findOne({
          //email: emailId
          userName,
          active: true,
        }).select(
          'fname active mobileNo email userTag passwordAttempt emailVerified '
        );
        console.log('emailCheck', emailCheck);
        userCode = UtilController.checkEmailStatus(emailCheck);
        console.log('userCode', userCode + '     ' + returnCode.validEmail);
        req.session.userCode = userCode;
        if (userCode === returnCode.validEmail) {
          req.session.username = userName;
        }
      }
      // check the password
      if (!UtilController.isEmpty(password)) {
        // first check the userType, then check the password in respective collection
        if (
          UtilController.isEmpty(req.session.username) ||
          UtilController.isEmpty(req.session.userCode) ||
          req.session.userCode !== returnCode.validEmail
        ) {
          userCode = returnCode.invalidSession; //Session is not valid, relogin to generate new session and associate
          if (!UtilController.isEmpty(req.session.userCode)) {
            userCode = req.session.userCode;
          }
        } else {
          let emailObj = await User.findOne({
            userName: req.session.username,
          }).select(
            'fname active email mobileNo userTag  password passwordAttempt emailVerified userType areaId isSuperAdmin'
          );

          console.log('emailObj', emailObj);

          userCode = UtilController.comparePassword(
            emailObj.password,
            password,
            passwordSecretKey
          );
          console.log(' comparePassword' + userCode);
          if (userCode === returnCode.passwordMatched) {
            // check for two factor authorization
            if (configuration.login['2FactorAuthentication']) {
              userCode = returnCode['2FactorEnabled'];
              console.log('sessionId', req.sessionID);
              systemCache.set(
                req.sessionID,
                emailObj._id,
                configuration.login.otpValidation
              ); // 10 minute time
              await module.exports.sendOtp(req, emailObj);
            } else {
              req.session.userId = emailObj._id;

              req.session.isSuperAdmin = emailObj.isSuperAdmin;
              //req.session.areaId=emailObj.areaId;
              await User.findOneAndUpdate(
                {
                  userName: req.session.username,
                },
                {
                  lastLogin: Math.floor(Date.now() / 1000),
                }
              ).select('areaId userType');
            }
          } else {
            await User.findOneAndUpdate(
              {
                userName: req.session.username,
              },
              {
                $inc: {
                  passwordAttempt: 1,
                },
              }
            );
          }
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: userCode,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  verifyOtp: async (req, res, next) => {
    try {
      let response = returnCode.invalidToken;
      let userResult = {};
      if (Number(req.body.otpVal) === Number(req.session.otpVal)) {
        response = returnCode.validSession;
        let userSes = systemCache.get(req.sessionID);
        if (!(typeof userSes === 'undefined' || userSes === null)) {
          req.session.userId = userSes;
          let userResult = await User.findByIdAndUpdate(userSes, {
            lastLogin: Math.floor(Date.now() / 1000),
          }).select('areaId userType isSuperAdmin');

          req.session.isSuperAdmin = userResult.isSuperAdmin;
          //req.session.areaId=userResult.areaId;
          systemCache.del(req.sessionID);
        } else {
          response = returnCode.invalidToken;
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
        //user: userResult,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  queryAllUser: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;

      let queryObj = {
        active: req.body.active,
        userType: req.body.userType,
      };
      if (req.body.userType === 'all') {
        delete queryObj.userType;
      }

      console.log('querytest', queryObj);

      console.log('search1', searchKey);
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            fname: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            lname: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          {
            mobileNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
          // {
          //   email: {
          //     $regex: searchKey,
          //     $options: 'i',
          //   },
          // },
          {
            patientId: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }

      let sortOrder = {};
      if (req.body.sortOrder !== '' && req.body.sortField !== '') {
        sortOrder[req.body.sortField] = req.body.sortOrder === 'false' ? -1 : 1;
      } else {
        sortOrder = {
          updatedAt: -1,
        };
      }

      console.log('query', queryObj);
      let result = await User.find(queryObj)

        .sort(sortOrder)
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await User.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: result,
        pages: Math.ceil(pageCount / req.body.pageSize),
        filterRecords: pageCount,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  createUser: async (req, res, next) => {
    try {
      let createObj = req.body;

      createObj['emailVerified'] = true;
      let userResult = await User.find({
        userName: req.body.mobileNo,
        userType: req.body.userType,
      });

      console.log('userResult', userResult);

      if (userResult.length === 0) {
        createObj['userName'] = req.body.mobileNo;

        createObj['createdAt'] = Math.floor(Date.now() / 1000);

        if (createObj.userType === 'admin') {
          // let userPassword = Math.random().toString(36).slice(-8);
          let userPassword = 'geeksAdmin';

          createObj['operatedBy'] = req.session.userId;
          var ciphertext = CryptoJS.AES.encrypt(
            userPassword,
            passwordSecretKey
          );
          createObj['password'] = ciphertext.toString();
          NotificationController.userCredentials({
            email: createObj.email,
            data: {
              name: createObj.fname,
              userName: createObj.userName,
              password: userPassword,
              userType: createObj.userType,
            },
          });
        }

        console.log('createObj', createObj);
        await User.create(createObj);
        UtilController.sendSuccess(req, res, next, {});
      } else {
        UtilController.sendSuccess(req, res, next, {
          responseCode: returnCode.duplicate,
        });
      }
    } catch (err) {
      console.log('1');

      UtilController.sendError(req, res, next, err);
    }
  },

  // createUser: async (req, res, next) => {
  //   try {
  //     let createObj = req.body;

  //     let userNameCnt = await User.countDocuments({
  //       userName: req.body.userName.toLowerCase(),
  //     });
  //     let mobileNocnt = await User.countDocuments({
  //       mobileNo: req.body.mobileNo,
  //     });
  //     let emailcnt = await User.countDocuments({
  //       email: req.body.email.toLowerCase(),
  //     });

  //     if (userNameCnt === 1 || mobileNocnt === 1 || emailcnt === 1) {
  //       UtilController.sendDuplicate(req, res, next, {});
  //     } else {
  //       await User.create(createObj);
  //       UtilController.sendSuccess(req, res, next, {});
  //     }
  //   } catch (err) {
  //     UtilController.sendError(req, res, next, err);
  //   }
  // },

  getUserById: async (req, res, next) => {
    try {
      let userId = req.body.userId;
      let user = await User.findById(userId);
      // console.log("update resp", user, userId);

      UtilController.sendSuccess(req, res, next, {
        user,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },
  getAdminByMobile: async (req, res, next) => {
    try {
      let bufferObj = req.query.ui;
      console.log('bufferCode', bufferObj);

      let buf = new Buffer(bufferObj, 'base64');

      let decodedContent = buf.toString('ascii');
      console.log('decode', decodedContent);

      let user = await User.findOne({ userTag: decodedContent });
      console.log(req.sessionId);

      let otpVal = UtilController.getOTP({
        mobileNo: user.mobileNo,
      });
      systemCache.set(
        req.sessionID,
        user._id,
        configuration.login.otpValidation
      ); // 5 minute time
      console.log('cacge', systemCache);
      req.session.otpVal = otpVal;
      console.log('otp', otpVal, req.session.otpVal);
      NotificationController.userMobileNoOtp({
        mobileNo: user.mobileNo,
        otp: otpVal,
        data: {
          otp: otpVal,
        },
        content: 'your otp is this',
      });

      UtilController.sendSuccess(req, res, next, {
        user,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },
  getProfileByMobile: async (req, res, next) => {
    try {
      let mobileNo = req.body.mobileNo;
      let user = await User.find({ mobileNo });

      UtilController.sendSuccess(req, res, next, {
        user,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  verifyOtpNewAdmin: async (req, res, next) => {
    try {
      let response = returnCode.invalidToken;
      console.log('req', req.body.otpVal, req.session.otpVal);

      if (Number(req.body.otpVal) === Number(req.session.otpVal)) {
        response = returnCode.validSession;
        let userSes = systemCache.get(req.sessionID);
        if (!(typeof userSes === 'undefined' || userSes === null)) {
          req.session.userId = userSes;

          //req.session.areaId=userResult.areaId;
          systemCache.del(req.sessionID);
        } else {
          response = returnCode.invalidToken;
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
        //user: userResult,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  resendOtp: async (req, res, next) => {
    try {
      console.log('reaching');
      let userSes = systemCache.get(req.sessionID);
      if (!(typeof userSes === 'undefined' || userSes === null)) {
        let userObj = await User.findById(userSes).select(
          'name active email mobileNo userTag emailVerified'
        );
        await module.exports.sendOtp(req, userObj);
      } else {
        response = returnCode.invalidToken;
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  sendOtp: async (req, userObj) => {
    try {
      let otpVal = UtilController.getOTP(userObj);
      req.session.otpVal = otpVal;
      NotificationController.sendUserOtp({
        mobileNo: userObj.mobileNo,
        email: userObj.email,
        otp: otpVal,
        data: {
          otp: otpVal,
          userName: userObj.fname,
        },
      });
    } catch (err) {
      console.error(err);
    }
  },

  accountLogout: async function (req, res, next) {
    try {
      if (!UtilController.isEmpty(req.session.userId)) {
        req.session.destroy();
      }
      UtilController.sendSuccess(req, res, next, {
        message: 'user account is logout successfully',
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  updateUser: async (req, res, next) => {
    try {
      let updateObj = req.body;
      updateObj.dob = Math.floor(new Date(updateObj.dob).getTime() / 1000.0);
      updateObj.allergies = updateObj.allergies.toString();
      updateObj.chronicConditions = updateObj.chronicConditions.toString();

      updateObj.familyHistory = updateObj.familyHistory.toString();
      updateObj.surgeries = updateObj.surgeries.toString();

      updateObj['userName'] = req.body.mobileNo;

      updateObj['updatedAt'] = Math.floor(Date.now() / 1000);

      if (
        req.body.password !== undefined &&
        req.body.password !== null &&
        req.body.password !== ''
      ) {
        let userPassword = req.body.password;
        var ciphertext = CryptoJS.AES.encrypt(userPassword, passwordSecretKey);
        updateObj['password'] = ciphertext.toString();
      } else {
        delete updateObj.password;
      }
      await User.findByIdAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.userId),
          // operatedBy: mongoose.Types.ObjectId(req.session.userId),
        },
        updateObj
      ).select('-id');
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      let oldPassword = req.body.oldPassword;
      let userCode = returnCode.passwordMismatch;
      let encriptedNewPsw = CryptoJS.AES.encrypt(
        req.body.password,
        passwordSecretKey
      );
      let encriptedNewPassword = encriptedNewPsw.toString();
      let userEmailObj = await User.findById(req.session.userId).select(
        'name active email password'
      );
      userCode = UtilController.comparePassword(
        userEmailObj.password,
        oldPassword,
        passwordSecretKey
      );
      if (userCode === returnCode.passwordMatched) {
        await User.findByIdAndUpdate(req.session.userId, {
          password: encriptedNewPassword,
        });
        req.session.destroy();
      }

      UtilController.sendSuccess(req, res, next, {
        responseCode: userCode,
        message: 'User password reset is done successfully',
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  deleteUser: async (req, res, next) => {
    try {
      await User.findByIdAndUpdate(req.body.userId, {
        active: false,
        updatedAt: Math.floor(Date.now() / 1000),
        $push: {
          logs: {
            recordId: req.session.recordId,
            data: {
              active: true,
            },
          },
        },
      });
      UtilController.sendSuccess(req, res, next, {
        message: 'User is deleted successfully',
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getUserInfoById: async (req, res, next) => {
    try {
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  resetPasswordAttempt: async (req, res, next) => {
    try {
      console.log('resetPasswordAttempt');
      await User.findByIdAndUpdate(req.body.userId, {
        passwordAttempt: 0,
        updatedAt: Math.floor(Date.now() / 1000),
        $push: {
          logs: {
            userId: req.session.userId,
            data: {
              passwordAttempt: 0,
            },
          },
        },
      });
      UtilController.sendSuccess(req, res, next, {
        message: 'User passwordAttempt reset is done successfully',
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  forgotPasswordEmail: async (req, res, next) => {
    try {
      let mobileNo = req.query.username.trim();
      let emailCheck = await User.findOne({
        userName: mobileNo,
        active: true,
        //email: emailId
      }).select(
        'fname active email userName fname userTag mobileNo passwordAttempt emailVerified '
      );
      let newPassword = Math.random().toString(36).slice(-8);
      let emailAccount = {
        email: emailCheck.email,
        receiverName: '',
        userName: emailCheck.userName,
      };

      userCode = UtilController.checkEmailStatus(emailCheck);
      if (userCode === returnCode.validEmail) {
        // send password in email
        emailAccount['receiverName'] = emailCheck.fname;
        NotificationController.forgotPassword({
          //userId: req.session.userId,
          //emailId,
          emailId: emailCheck.email,
          password: newPassword,
          receiverName: emailCheck.fname,
        });
      }

      // update cache information
      systemCache.set(newPassword, emailAccount, 1200); // 20 minute time
      UtilController.sendSuccess(req, res, next, {
        responseCode: userCode,
        message: 'User forgot password request is sent over the email',
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  generatePassword: async (req, res, next) => {
    try {
      let token = req.query.token.trim();

      let emailObj = systemCache.get(token);
      let newPassword = Math.random().toString(36).slice(-8);
      let encriptedNewPsw = CryptoJS.AES.encrypt(
        newPassword,
        passwordSecretKey
      );
      let encriptedNewPassword = encriptedNewPsw.toString();
      let response = returnCode.invalidToken;
      if (!(typeof emailObj === 'undefined' || emailObj === null)) {
        await User.findOneAndUpdate(
          {
            userName: emailObj.userName,
          },
          {
            password: encriptedNewPassword,
          }
        );

        response = returnCode.newPasswordGenerated;
        NotificationController.generatedPassword({
          emailId: emailObj.email,
          password: newPassword,
          receiverName: emailObj.receiverName,
          userType: emailObj.userType,
        });
        systemCache.del(token);
      }

      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  sendCustomEmail: async function (userEmails, subject, emailbody) {
    try {
      for (let i = 0; i < userEmails.length; i++) {
        let cntVal = await User.find({
          email: userEmails[i],
          active: true,
          subscribe: true,
        }).select('name email');
        if (cntVal !== undefined && cntVal.length > 0) {
          NotificationController.userCustomEmail({
            userId: cntVal[0]._id,
            emailId: cntVal[0].email,
            subject: subject,
            emailbody: emailbody,
          });
        }
      }
    } catch (err) {
      console.error(err);
    }
  },
  hasUserNameExist: async (req, res, next) => {
    try {
      let responseCode = returnCode.duplicate;
      let userCnt = await User.countDocuments({
        userName: req.body.userName,
      });
      if (userCnt === 0) {
        responseCode = returnCode.noDuplicate;
      }
      UtilController.sendSuccess(req, res, next, {
        message: 'User account plan is upgrated successfully',
        responseCode,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  activateUserAccount: async (req, res, next) => {
    try {
      let responseCode = returnCode.duplicate;
      let userCnt = await User.countDocuments({
        userName: req.body.userName,
      });
      if (userCnt === 0) {
        responseCode = returnCode.noDuplicate;
        let updateObj = req.body;
        updateObj['active'] = true;
        updateObj['$push'] = {
          logs: {
            userId: req.session.userId,
            data: {
              active: true,
            },
          },
        };
        let newPassword = Math.random().toString(36).slice(-8);
        console.log('newPassword');
        console.log(newPassword);
        var ciphertext = CryptoJS.AES.encrypt(newPassword, passwordSecretKey);
        updateObj['password'] = ciphertext.toString();
        await User.findByIdAndUpdate(req.body.userId, updateObj);
        // send user login credentials
        NotificationController.userCredentials({
          userId: req.body.userId,
          userName: updateObj.userName,
          password: newPassword,
          receiverName: '',
          userType: 'user',
        });
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode,
        message: 'User account is activated successfully',
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  listUploadedFiles: async (req, res, next) => {
    try {
      console.log('listUploadedFiles');
      let { menuName, operationType } = req.body;
      let queryObj = {
        active: true,
        menuName,
        operationType,
        userId: req.session.userId,
      };
      console.log({ queryObj });
      let result = await DataFileUpload.find(queryObj);
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  fileDownloader: async (req, res, next) => {
    try {
      let filesUrl = req.query.file;
      let fileType =
        '.' +
        filesUrl.substring(filesUrl.lastIndexOf('.') + 1, filesUrl.length);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename=' + req.query.fileName + fileType

        // filesUrl.split('/').pop()
      );
      await request
        .get(filesUrl)
        .on('error', function (err) {
          console.log(err);
        })
        .pipe(res);
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};
