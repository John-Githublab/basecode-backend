let request = require('request');
let mongoose = require('mongoose');
var CryptoJS = require('crypto-js');
const responseCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const AwsController = require('./../services/AwsController');
const awsConfig = require('./../../../config/connection');
var link = awsConfig.aws.link;
module.exports = {
  sendSuccess: async (req, res, next, data) => {
    if (module.exports.isEmpty(data.responseCode)) {
      data['responseCode'] = responseCode.validSession;
    }
    res.status(200).send({
      message: 'success',
      code: responseCode.success,
      data: data,
    });
  },
  sendError: async (req, res, next, err) => {
    console.error(err);
    res.status(500).send({
      message: 'failure',
      code: responseCode.errror,
      data: err,
    });
  },
  isEmpty: (data) => {
    let returnObj = false;
    if (
      typeof data === 'undefined' ||
      data === null ||
      data === '' ||
      data === '' ||
      data.length === 0
    ) {
      returnObj = true;
    }
    return returnObj;
  },
  checkEmailStatus: (userObj) => {
    let userCode = responseCode.accountSuspended; // user account is suspended/ deactivated, needs to check with admin team
    try {
      if (!module.exports.isEmpty(userObj)) {
        if (!userObj.emailVerified) {
          userCode = responseCode.notVerifiedEmail; // success, email id is valid
        }
        if (userObj.active && userCode === responseCode.accountSuspended) {
          userCode = responseCode.validEmail; // success, email id is valid
        }
        if (userObj.passwordAttempt > 2) {
          userCode = responseCode.exceededpasswordAttempt; // success, email id is valid
        }
      } else {
        userCode = responseCode.emailNotFound; // email id is not there, wrong email address, records not found in DB
      }
    } catch (err) {
      console.error(err);
      userCode = responseCode.userException;
    } finally {
      return userCode;
    }
  },
  comparePassword: (passwordHash, userPassword, secretKey) => {
    let returnObj = responseCode.passwordMismatch;
    try {
      // Decrypt
      let bytes = CryptoJS.AES.decrypt(passwordHash, secretKey);
      let decryptedPwd = bytes.toString(CryptoJS.enc.Utf8);
      if (decryptedPwd === userPassword) {
        returnObj = responseCode.passwordMatched;
      }
    } catch (err) {
      console.error(err);
      returnObj = responseCode.userException;
    } finally {
      return returnObj;
    }
  },
  getOTP: (userObj) => {
    console.log('getOTP');
    let otpVal = 0;
    try {
      if (Number(userObj.mobileNo) === 09876543210) {
        // later we can do email otp verification also. this case if for the tester account bypass
        otpVal = '135799';
      } else {
        otpVal = Math.floor(Math.random() * (999999 - 100000)) + 100000;
      }
      otpVal = '135799'; // this is temparoty solution, once integrate sms gateway, need to remove this one
    } catch (err) {
      console.error(err);
    }
    console.log('return otp= ' + otpVal);
    return otpVal;
  },
  uploadFiles: async function (req, res, next) {
    try {
      //var attachmentUrl = "";
      var attachmentUrlArray = [];
      var code = 1;
      console.log(req.body);
      if (
        !(req.files === null || req.files === undefined) &&
        !(req.files.attachment === undefined)
      ) {
        // to get the bucket name based on input condition, starts Here
        var bucket = awsConfig.aws.bucket + '/' + req.body.bucketName;

        // ends here
        var attachmentObj = req.files.attachment;
        if (Array.isArray(attachmentObj)) {
          for (var i = 0; i < attachmentObj.length; i++) {
            var attachmentName =
              Date.now() + '_' + attachmentObj[i].originalname;
            attachmentUrlArray.push(
              link.concat(bucket + '/' + encodeURIComponent(attachmentName))
            );
            await AwsController.upload2AWS(
              attachmentObj[i].path,
              bucket,
              attachmentName,
              attachmentObj[i].mimetype
            ); // this is async call, will not wait until to finish upload
          }
        } else {
          var attachmentPath = attachmentObj.path;
          var attachmentName = Date.now() + '_' + attachmentObj.originalname;
          //  attachmentUrl = link.concat(bucket + '/' + attachmentName);
          attachmentUrlArray.push(
            link.concat(bucket + '/' + encodeURIComponent(attachmentName))
          );
          await AwsController.upload2AWS(
            attachmentPath,
            bucket,
            attachmentName,
            attachmentObj.mimetype
          ); // this is async call, will not wait until to finish upload
        }
      }
      module.exports.sendSuccess(req, res, next, {
        attachmentUrl: attachmentUrlArray,
      });
    } catch (err) {
      console.error(err);
      module.exports.sendError(req, res, next, err);
    }
  },

  uploadFileWithReturn: async function (bucketParam, req, res, next) {
    try {
      //var attachmentUrl = "";
      var attachmentUrlArray = [];
      var code = 1;
      if (!(req.files === null || req.files === undefined)) {
        // to get the bucket name based on input condition, starts Here
        var bucket = bucketParam;
        // var bucket = awsConfig.aws.inventoryImageBucket;

        // ends here
        var attachmentObj = Object.values(req.files);
        if (Array.isArray(attachmentObj)) {
          for (var i = 0; i < attachmentObj.length; i++) {
            var attachmentName =
              Date.now() + '_' + attachmentObj[i].originalname;
            attachmentUrlArray.push(
              link.concat(bucket + '/' + encodeURIComponent(attachmentName))
            );
            await AwsController.upload2AWS(
              attachmentObj[i].path,
              bucket,
              attachmentName,
              attachmentObj[i].mimetype
            ); // this is async call, will not wait until to finish upload
          }
        } else {
          var attachmentPath = attachmentObj.path;
          var attachmentName = Date.now() + '_' + attachmentObj.originalname;
          //  attachmentUrl = link.concat(bucket + '/' + attachmentName);
          attachmentUrlArray.push(
            link.concat(bucket + '/' + encodeURIComponent(attachmentName))
          );
          await AwsController.upload2AWS(
            attachmentPath,
            bucket,
            attachmentName,
            attachmentObj.mimetype
          ); // this is async call, will not wait until to finish upload
        }
      }
      return attachmentUrlArray;
      // module.exports.sendSuccess(req, res, next, {
      //   attachmentUrl: attachmentUrlArray,
      // });
    } catch (err) {
      console.error(err);
      module.exports.sendError(req, res, next, err);
    }
  },
  uploadFilesToStorage: async function (bucketParam, req, res, next) {
    try {
      //var attachmentUrl = "";
      var attachmentUrlArray = [];
      var code = 1;
      console.log(req.body);
      if (
        !(req.files === null || req.files === undefined) &&
        !(req.files.attachment === undefined)
      ) {
        // to get the bucket name based on input condition, starts Here
        var bucket = bucketParam;

        // ends here
        var attachmentObj = req.files.attachment;
        if (Array.isArray(attachmentObj)) {
          for (var i = 0; i < attachmentObj.length; i++) {
            var attachmentName =
              Date.now() + '_' + attachmentObj[i].originalname;
            attachmentUrlArray.push(
              link.concat(bucket + '/' + encodeURIComponent(attachmentName))
            );
            await AwsController.upload2AWS(
              attachmentObj[i].path,
              bucket,
              attachmentName,
              attachmentObj[i].mimetype
            ); // this is async call, will not wait until to finish upload
          }
        } else {
          var attachmentPath = attachmentObj.path;
          var attachmentName = Date.now() + '_' + attachmentObj.originalname;
          //  attachmentUrl = link.concat(bucket + '/' + attachmentName);
          attachmentUrlArray.push(
            link.concat(bucket + '/' + encodeURIComponent(attachmentName))
          );
          await AwsController.upload2AWS(
            attachmentPath,
            bucket,
            attachmentName,
            attachmentObj.mimetype
          ); // this is async call, will not wait until to finish upload
        }
      }
      return attachmentUrlArray;
      // module.exports.sendSuccess(req, res, next, {
      //   attachmentUrl: attachmentUrlArray
      // });
    } catch (err) {
      console.error(err);
      return new Array();
      // module.exports.sendError(req, res, next, err);
    }
  },
  pad: (num, size) => {
    var s = num + '';
    while (s.length < size) s = '0' + s;
    return s;
  },
};
