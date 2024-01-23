let request = require("request");
let mongoose = require("mongoose");
var CryptoJS = require("crypto-js");
const connection = require("./../../../config/connection");
const configuration = require("./../../../config/configuration");
const returnCode = require("./../../../config/responseCode").returnCode;
const User = require("./../../models/User");
const Option = require("./../../models/Option");
const Notification = require("./../../models/Notification");
const AuthorizationController = require("./../services/AuthorizationController");
const NotificationController = require("./../services/NotificationController");
const UtilController = require("./../services/UtilController");
const Tag = require("./../../models/Tag");
var passwordSecretKey = "Vaxi@2O$1"; // (pimarq)this is standerd key to generate password
const NodeCache = require("node-cache");
const systemCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: configuration.login.otpValidation,
});
module.exports = {
  // this function is used to check the user login status, does their session is there or not before login

  accountLoginStatus: async function (req, res, next) {
    try {
      let responseCode = returnCode.invalidSession;
      let userType = "";
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
            "fname lname email mobileNo userName profileImage userType permission deliveryAddress gender dob isSuperAdmin"
          )
          .populate("permission")
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
      console.log("req");
      let userCode = returnCode.validEmail;
      let userType = "user";
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
          "fname active mobileNo email userTag passwordAttempt emailVerified "
        );
        userCode = UtilController.checkEmailStatus(emailCheck);
        console.log("userCode", userCode + "     " + returnCode.validEmail);
        req.session.userCode = userCode;
        if (userCode === returnCode.validEmail) {
          req.session.username = userName;
          //req.session.userId;
          //req.session.employeeId;
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
            "fname active email mobileNo userTag  password passwordAttempt emailVerified userType areaId isSuperAdmin"
          );

          userCode = UtilController.comparePassword(
            emailObj.password,
            password,
            passwordSecretKey
          );
          console.log(" comparePassword" + userCode);
          if (userCode === returnCode.passwordMatched) {
            // check for two factor authorization
            if (configuration.login["2FactorAuthentication"]) {
              userCode = returnCode["2FactorEnabled"];
              console.log("sessionId", req.sessionID);
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
              ).select("areaId userType");
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
  mobileNoLogin: async (req, res, next) => {
    try {
      let userCode = returnCode.emailNotFound;
      let queryObj = {
        active: true,
        userName: req.body.mobileNo,
      };
      let userResult = await User.findOne(queryObj).select(
        "fname active email mobileNo userTag  password passwordAttempt emailVerified userType areaId isSuperAdmin"
      );

      //req.session.mobileNo = req.body.mobileNo;

      userCode = returnCode.emailNotFound;
      if (!(typeof userResult === "undefined" || userResult === null)) {
        let otpVal = UtilController.getOTP({
          mobileNo: req.body.mobileNo,
          email: "",
        });
        userCode = returnCode.validSession;
        systemCache.set(
          req.sessionID,
          userResult._id,
          configuration.login.otpValidation
        ); // 5 minute time

        req.session.otpVal = otpVal;
        if (!(Number(req.body.mobileNo) === 09876543210)) {
          NotificationController.userMobileNoOtp({
            mobileNo: userResult.mobileNo,
            otp: otpVal,
            hashCode: req.body.hashCode,
            data: {
              otp: otpVal,
              hashCode: req.body.hashCode,
            },
          });
        }
      }

      UtilController.sendSuccess(req, res, next, {
        responseCode: userCode,
        //user: userResult,
        //otp:otpVal
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
        if (!(typeof userSes === "undefined" || userSes === null)) {
          req.session.userId = userSes;
          let userResult = await User.findByIdAndUpdate(userSes, {
            lastLogin: Math.floor(Date.now() / 1000),
          }).select("areaId userType isSuperAdmin");

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
  getUserByMobile: async (req, res, next) => {
    try {
      let bufferObj = req.query.ui;

      let buf = new Buffer(bufferObj, "base64");

      let decodedContent = buf.toString("ascii");
      let user = await User.findOne({ userTag: decodedContent });

      let otpVal = UtilController.getOTP({
        mobileNo: user.mobileNo,
      });
      let userCode = returnCode.validSession;
      systemCache.set(
        req.sessionID,
        user._id,
        configuration.login.otpValidation
      ); // 5 minute time
      req.session.otpVal = otpVal;
      NotificationController.userMobileNoOtp({
        mobileNo: user.mobileNo,
        otp: otpVal,
        data: {
          otp: otpVal,
        },
        content: "your otp is this",
      });

      UtilController.sendSuccess(req, res, next, {
        user,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },
  resendOtp: async (req, res, next) => {
    try {
      let response;
      let userSes = systemCache.get(req.sessionID);
      if (!(typeof userSes === "undefined" || userSes === null)) {
        let userObj = await User.findById(userSes).select(
          "fname active email mobileNo userTag emailVerified"
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
  create: async (req, res, next) => {
    try {
      let createObj = req.body;
      createObj["emailVerified"] = true;
      let user = {};
      userCode = returnCode.validSession;
      let userResult = await User.find({
        userName: req.body.mobileNo,
      });
      if (userResult.length === 0) {
        let tagResult = await Tag.findOneAndUpdate(
          {
            active: true,
            tagType: "users",
          },
          { $inc: { sequenceNo: 1 }, updatedAt: Math.floor(Date.now() / 1000) }
        );
        createObj["userTag"] = tagResult?.sequenceNo;
        let tagPatientResult = await Tag.findOneAndUpdate(
          {
            active: true,
            tagType: "patient",
          },
          {
            $inc: { sequenceNo: 1 },
            updatedAt: Math.floor(Date.now() / 1000),
          }
        );

        createObj["patientId"] =
          tagPatientResult.prefix +
          UtilController.pad(tagPatientResult.sequenceNo, 5);
        let userResult = await User.create(createObj);
        user = await User.findById(userResult._id)
          .select(
            "fname lname email mobileNo userName profileImage userType permission deliveryAddress gender dob"
          )
          .populate("permission")
          .lean();
        req.session.userId = userResult._id;
        let Result = await User.findByIdAndUpdate(userResult._id, {
          lastLogin: Math.floor(Date.now() / 1000),
        }).select("areaId userType isSuperAdmin");

        req.session.isSuperAdmin = Result.isSuperAdmin;
      } else {
        userCode = returnCode.duplicate;
      }

      UtilController.sendSuccess(req, res, next, {
        responseCode: userCode,
        user: user,
        message: "User is Created successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  update: async (req, res, next) => {
    try {
      let updateObj = req.body;
      updateObj["$push"] = {
        logs: {
          userId: req.session.userId,
          data: updateObj,
        },
      };
      await User.findByIdAndUpdate(req.body.userId, updateObj);
      UtilController.sendSuccess(req, res, next, {
        message: "User is updated successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  delete: async (req, res, next) => {
    try {
      await User.findByIdAndUpdate(req.body.userId, {
        active: false,
        $push: {
          logs: {
            userId: req.session.userId,
            data: {
              active: true,
            },
          },
        },
      });
      UtilController.sendSuccess(req, res, next, {
        message: "User is deleted successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getInfoById: async (req, res, next) => {
    try {
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  resetPasswordAttempt: async (req, res, next) => {
    try {
      await User.findByIdAndUpdate(req.body.userId, {
        passwordAttempt: 0,
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
        message: "User passwordAttempt reset is done successfully",
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
        "fname active email userName fname userTag mobileNo passwordAttempt emailVerified "
      );
      let newPassword = Math.random().toString(36).slice(-8);
      let emailAccount = {
        email: emailCheck.email,
        receiverName: "",
        userName: emailCheck.userName,
      };

      userCode = UtilController.checkEmailStatus(emailCheck);
      if (userCode === returnCode.validEmail) {
        // send password in email
        emailAccount["receiverName"] = emailCheck.fname;
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
        message: "User forgot password request is sent over the email",
      });
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
        "fname active email password"
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
        message: "User password reset is done successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  sendPromotionalEmail: async function (req, res, next) {
    try {
      let toEmail = req.body.destination.split(",");
      let delay = 2000;
      for (let i = 0; i < toEmail.length; i++) {
        if (i % 10 == 0) {
          let userEmails = [];
          if (toEmail.length > i + 10) {
            userEmails = toEmail.slice(i, i + 10);
          } else {
            userEmails = toEmail.slice(i, toEmail.length);
          }
          setTimeout(
            module.exports.sendCustomEmail,
            delay,
            userEmails,
            req.body.subject,
            req.body.emailbody
          );
          delay += 2000;
        }
      }
      res.status(200).send({
        status: "success",
        code: 1,
      });
    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: "failure",
        code: 6,
        errorCode: err.code,
        message: err.message,
      });
    }
  },
  sendCustomEmail: async function (userEmails, subject, emailbody) {
    try {
      for (let i = 0; i < userEmails.length; i++) {
        let cntVal = await User.find({
          email: userEmails[i],
          active: true,
          subscribe: true,
        }).select("fname email");
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
        message: "User account plan is upgrated successfully",
        responseCode,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  activateAccount: async (req, res, next) => {
    try {
      let responseCode = returnCode.duplicate;
      let userCnt = await User.countDocuments({
        userName: req.body.userName,
      });
      if (userCnt === 0) {
        responseCode = returnCode.noDuplicate;
        let updateObj = req.body;
        updateObj["active"] = true;
        updateObj["$push"] = {
          logs: {
            userId: req.session.userId,
            data: {
              active: true,
            },
          },
        };
        let newPassword = Math.random().toString(36).slice(-8);
        var ciphertext = CryptoJS.AES.encrypt(newPassword, passwordSecretKey);
        updateObj["password"] = ciphertext.toString();
        await User.findByIdAndUpdate(req.body.userId, updateObj);
        // send user login credentials
        NotificationController.userCredentials({
          userId: req.body.userId,
          userName: updateObj.userName,
          password: newPassword,
          receiverName: "",
          userType: "user",
        });
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode,
        message: "User account is activated successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  profileInfo: async (req, res, next) => {
    try {
      let profile = await User.findById(req.session.userId).select(
        "-logs -password"
      );
      UtilController.sendSuccess(req, res, next, {
        profile,
        message: "User profile info",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  updateProfile: async (req, res, next) => {
    try {
      let profileObj = req.body;
      await User.findByIdAndUpdate(req.session.userId, profileObj);

      UtilController.sendSuccess(req, res, next, {
        message: "User profile is updated successfully",
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
      if (!(typeof emailObj === "undefined" || emailObj === null)) {
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
  unsubscribeEmail: async function (req, res, next) {
    try {
      await User.findOneAndUpdate(
        {
          email: req.params.email,
        },
        {
          subscribe: false,
        }
      );
      UtilController.sendSuccess(req, res, next, {
        message: "user account is unsubscribed successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  accountLogout: async function (req, res, next) {
    try {
      if (!UtilController.isEmpty(req.session.userId)) {
        req.session.destroy();
      }
      UtilController.sendSuccess(req, res, next, {
        message: "user account is logout successfully",
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  uploadFiles: async (req, res, next) => {
    try {
      UtilController.uploadFiles(req, res, next);
    } catch (err) {
      console.log("uploadFiles -catch");
      console.log(err);
      UtilController.sendError(req, res, next, err);
    }
  },
  getAllDropdownList: async (req, res, next) => {
    try {
      let queryObj = {};
      if (!UtilController.isEmpty(req.query.name)) {
        queryObj["name"] = req.query.name;
      }
      let result = await Option.find(queryObj);
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
        userType: "user",
      };
      if (!UtilController.isEmpty(searchKey)) {
        queryObj["$or"] = [
          {
            mobileNo: {
              $regex: searchKey,
              $options: "i",
            },
          },
          {
            fname: {
              $regex: searchKey,
              $options: "i",
            },
          },
          {
            lname: {
              $regex: searchKey,
              $options: "i",
            },
          },
          {
            email: {
              $regex: searchKey,
              $options: "i",
            },
          },
        ];
      }
      let result = await User.find(queryObj)
        .select("fname lname mobileNo email profileImage gender")
        .sort({ fname: 1 });
      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getUserProfile: async (req, res, next) => {
    try {
      let user = await User.findById(req.session.userId)
        .select(
          "patient caregiver fname lname mobileNo email gender profileImage bloodGroup dob city state country pin fragmentedAddress alcoholIntake allergies chronicConditions familyHistory height surgeries weight notification isSmoker address1 address2"
        )
        .populate("patient", "fname lname mobileNo email profileImage")
        .populate("caregiver", "fname lname mobileNo email profileImage");
      UtilController.sendSuccess(req, res, next, {
        user,
      });
    } catch (err) {
      console.log(err);
      UtilController.sendError(req, res, next, err);
    }
  },

  checkUserPresent: async (req, res, next) => {
    try {
      console.log(req.query);
      let response = returnCode.invalidToken;
      let result = await User.find({
        userName: req.query.mobileNo,
      });
      console.log(result);
      if (result.length > 0) {
        response = returnCode.validSession;
      } else {
        let otpVal = UtilController.getOTP({
          mobileNo: req.query.mobileNo,
          email: "",
        });
        userCode = returnCode.validSession;
        req.session.otpVal = otpVal;
        if (!(Number(req.query.mobileNo) === 09876543210)) {
          NotificationController.userMobileNoOtp({
            mobileNo: req.query.mobileNo,
            otp: otpVal,
            hashCode: req.query.hashCode,
            data: {
              otp: otpVal,
              hashCode: req.query.hashCode,
            },
          });
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
  checkUserPresentVerifyOtp: async (req, res, next) => {
    try {
      console.log(req.query);
      let response = returnCode.invalidToken;

      if (req.session.otpVal === req.query.otpVal) {
        response = returnCode.validSession;
      }
      UtilController.sendSuccess(req, res, next, {
        responseCode: response,
        //user: userResult,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};
