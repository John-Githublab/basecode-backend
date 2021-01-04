let request = require('request');
let fs = require('fs');
let mongoose = require('mongoose');
var CryptoJS = require('crypto-js');
const connection = require('./../../../config/connection');
const User = require('./../../models/User');
const DataFileUpload = require('./../../models/DataFileUpload');
const Tag = require('./../../models/Tag');

const configuration = require('./../../../config/configuration');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
const returnCode = require('./../../../config/responseCode').returnCode;

var passwordSecretKey = 'Admin@2O$0'; // (pimarq)this is standerd key to generate password
const NodeCache = require('node-cache');
const Case = require('../../models/Case');

const systemCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: configuration.login.otpValidation,
});

module.exports = {
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
      console.log('reaching');
      let createObj = req.body;

      createObj.dob = Math.floor(new Date(createObj.dob).getTime() / 1000.0);
      createObj.allergies = createObj.allergies.toString();
      createObj.chronicConditions = createObj.chronicConditions.toString();
      createObj.familyHistory = createObj.familyHistory.toString();
      createObj.surgeries = createObj.surgeries.toString();

      createObj['emailVerified'] = true;
      let userResult = await User.find({
        userName: req.body.mobileNo,
        userType: req.body.userType,
      });

      if (userResult.length === 0) {
        createObj['userName'] = req.body.mobileNo;

        createObj['createdAt'] = Math.floor(Date.now() / 1000);
        let tagResult = await Tag.findOneAndUpdate(
          {
            active: true,
            tagType: 'users',
          },
          { $inc: { sequenceNo: 1 }, updatedAt: Math.floor(Date.now() / 1000) }
        );
        createObj['userTag'] = tagResult.sequenceNo;
        let buf = Buffer.from(tagResult.sequenceNo.toString(), 'utf-8');
        let bufferObj = buf.toString('base64');

        let emailAccount = {
          email: createObj.email,
          receiverName: createObj.fname,
          userName: createObj.userName,
        };

        if (createObj.userType === 'user') {
          let tagPatientResult = await Tag.findOneAndUpdate(
            {
              active: true,
              tagType: 'patient',
            },
            {
              $inc: { sequenceNo: 1 },
              updatedAt: Math.floor(Date.now() / 1000),
            }
          );

          createObj['patientId'] =
            tagPatientResult.prefix +
            UtilController.pad(tagPatientResult.sequenceNo, 5);

          NotificationController.newRegistration({
            emailId: createObj.email,
            confirmation: bufferObj,
            receiverName: createObj.fname,
          });
        } else {
          let userPassword = Math.random().toString(36).slice(-8);
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
        console.log(createObj);
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
      let userCode = returnCode.validSession;
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
      let userResult = {};
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
      let userType = req.session.userType;
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
      console.log('reaching');
      let mobileNo = req.query.username.trim();
      let emailCheck = await User.findOne({
        userName: mobileNo,
        active: true,
        //email: emailId
      }).select('name active email userTag passwordAttempt emailVerified ');
      let newPassword = Math.random().toString(36).slice(-8);
      let emailAccount = {
        email: emailCheck.email,
        receiverName: '',
      };

      userCode = UtilController.checkEmailStatus(emailCheck);
      if (userCode === returnCode.validEmail) {
        // send password in email
        emailAccount['receiverName'] = emailCheck.name;
        NotificationController.forgotPassword({
          //userId: req.session.userId,
          //emailId,
          emailId: emailCheck.email,
          password: newPassword,
          receiverName: emailCheck.name,
        });
      }

      console.log('new', newPassword);
      // update cache information
      systemCache.set(newPassword, emailAccount, 1200); // 20 minute time
      console.log('system', systemCache.newPassword);
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
      let token = req.params.token.trim();
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
            email: emailObj.email,
          },
          {
            password: encriptedNewPassword,
          }
        );

        console.log('newgen', newPassword);
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

  searchAdmin: async (req, res, next) => {
    try {
      let searchKey = req.query.keyword;
      let queryObj = {
        active: true,
        userType: 'admin',
      };
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            mobileNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
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
            email: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }
      let result = await User.find(queryObj)
        .select('fname lname mobileNo email profileImage gender')
        .sort({ fname: 1 });
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  searchUser: async (req, res, next) => {
    try {
      let searchKey = req.query.keyword;
      let queryObj = {
        active: true,
        userType: 'user',
      };
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            mobileNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
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
            email: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }
      let result = await User.find(queryObj)
        .select('fname lname mobileNo email profileImage patientId gender')
        .sort({ fname: 1 });
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
  patientCaregiverList: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let searchType = req.body.searchType; // value should be patient/caregiver
      let patient = {};
      let caregiver = {};
      if (
        !UtilController.isEmpty(searchKey) &&
        !UtilController.isEmpty(searchType)
      ) {
        let searchObject = {};
        searchObject['$or'] = [
          {
            mobileNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
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
            email: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
        if (searchType === 'patient') {
          patient = searchObject;
        } else if (searchType === 'caregiver') {
          caregiver = searchObject;
        }
      }
      let user = await User.findById(req.body.userId)
        .select('patient caregiver')
        .populate({
          path: 'patient',
          match: patient,
          select: 'fname lname mobileNo email profileImage',
          options: { sort: { fname: 1 } },
        })
        .populate({
          path: 'caregiver',
          match: caregiver,
          select: 'fname lname mobileNo email profileImage',
          options: { sort: { fname: 1 } },
        });
      UtilController.sendSuccess(req, res, next, {
        user,
      });
    } catch (err) {
      console.log(err);
      UtilController.sendError(req, res, next, err);
    }
  },
  removePatientFromUser: async (req, res, next) => {
    try {
      let response = returnCode.notAvailable;
      if (
        !UtilController.isEmpty(req.body.patientId) &&
        !UtilController.isEmpty(req.body.userId)
      ) {
        let queryObj = {
          active: true,
          userType: 'user',
        };
        let patient = await User.findOne({
          ...queryObj,
          _id: req.body.patientId,
        });
        let caregiver = await User.findOne({
          ...queryObj,
          _id: req.body.userId,
        });
        if (
          patient !== undefined &&
          patient !== null &&
          caregiver !== undefined &&
          caregiver !== null
        ) {
          await User.update(
            { _id: req.body.userId },
            { $pull: { patient: req.body.patientId } }
          );
          await User.update(
            { _id: req.body.patientId },
            { $pull: { caregiver: req.body.userId } }
          );
          response = returnCode.success;
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  removeCaregiverFromUser: async (req, res, next) => {
    try {
      let response = returnCode.notAvailable;
      if (
        !UtilController.isEmpty(req.body.userId) &&
        !UtilController.isEmpty(req.body.caregiverId)
      ) {
        let queryObj = {
          active: true,
          userType: 'user',
        };
        let patient = await User.findOne({ ...queryObj, _id: req.body.userId });
        let caregiver = await User.findOne({
          ...queryObj,
          _id: req.body.caregiverId,
        });
        if (
          patient !== undefined &&
          patient !== null &&
          caregiver !== undefined &&
          caregiver !== null
        ) {
          await User.update(
            { _id: req.body.caregiverId },
            { $pull: { patient: req.body.userId } }
          );
          await User.update(
            { _id: req.body.userId },
            { $pull: { caregiver: req.body.caregiverId } }
          );
          response = returnCode.success;
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  addPatientToUser: async (req, res, next) => {
    try {
      let response = returnCode.notAvailable;
      if (
        !UtilController.isEmpty(req.body.patientId) &&
        !UtilController.isEmpty(req.body.userId)
      ) {
        let queryObj = {
          active: true,
          userType: 'user',
        };
        let patient = await User.findOne({
          ...queryObj,
          _id: req.body.patientId,
        });
        let caregiver = await User.findOne({
          ...queryObj,
          _id: req.body.userId,
        });
        if (
          patient !== undefined &&
          patient !== null &&
          caregiver !== undefined &&
          caregiver !== null
        ) {
          if (!caregiver.caregiver.includes(req.body.patientId)) {
            await User.update(
              { _id: req.body.userId },
              { $addToSet: { patient: req.body.patientId } }
            );
            await User.update(
              { _id: req.body.patientId },
              { $addToSet: { caregiver: req.body.userId } }
            );
            response = returnCode.success;
          } else {
            response = returnCode.duplicate;
          }
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  addCaregiverToUser: async (req, res, next) => {
    try {
      let response = returnCode.notAvailable;
      if (
        !UtilController.isEmpty(req.body.userId) &&
        !UtilController.isEmpty(req.body.caregiverId)
      ) {
        let queryObj = {
          active: true,
          userType: 'user',
        };
        let patient = await User.findOne({ ...queryObj, _id: req.body.userId });
        let caregiver = await User.findOne({
          ...queryObj,
          _id: req.body.caregiverId,
        });
        if (
          patient !== undefined &&
          patient !== null &&
          caregiver !== undefined &&
          caregiver !== null
        ) {
          if (!patient.patient.includes(req.body.caregiverId)) {
            await User.update(
              { _id: req.body.caregiverId },
              { $addToSet: { patient: req.body.userId } }
            );
            await User.update(
              { _id: req.body.userId },
              { $addToSet: { caregiver: req.body.caregiverId } }
            );
            response = returnCode.success;
          } else {
            response = returnCode.duplicate;
          }
        }
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  searchPatientCaregiver: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let queryObj = {
        active: true,
        userType: 'user',
      };

      if (!UtilController.isEmpty(req.body.userId)) {
        let userResult = await User.findById(req.body.userId).select(
          'patient caregiver'
        );
        let excludeResult = [req.body.userId];
        if (userResult !== undefined && userResult !== null) {
          excludeResult = excludeResult.concat(
            userResult.patient !== undefined && userResult.patient !== null
              ? userResult.patient
              : []
          );
          excludeResult = excludeResult.concat(
            userResult.caregiver !== undefined && userResult.caregiver !== null
              ? userResult.caregiver
              : []
          );
        }
        queryObj['_id'] = {
          $nin: excludeResult,
        };
      }

      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            mobileNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
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
        ];
      }

      let result = await User.find(queryObj)
        .select('fname lname mobileNo email profileImage patientId gender')
        .sort({ fname: 1 });
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

};
