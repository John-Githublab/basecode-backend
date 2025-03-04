let request = require("request");
let mongoose = require("mongoose");
var CryptoJS = require("crypto-js");
const responseCode = require("../../../config/responseCode").returnCode;
const User = require("../../../features/auth/model/User");
const AwsController = require("./AwsController");
const awsConfig = require("../../../config/connection");
var link = awsConfig.aws.link;
const PrettyConsole = require("../../../utils/PrettyConsole");

const prettyConsole = new PrettyConsole();

module.exports = {
  sendSuccess: async (req, res, next, data) => {
    if (module.exports.isEmpty(data.responseCode)) {
      data["responseCode"] = responseCode.validSession;
    }
    res.status(200).send({
      message: "success",
      code: responseCode.success,
      data: data,
    });
  },
  sendError: async (req, res, next, err) => {
    prettyConsole.error(
      "Error message: " +
        err?.message +
        ".   " +
        err.stack.split("\n")[1] +
        " " +
        err.stack.split("\n")[2]
    );
    const message = err?.message || "failure Occured";
    res.status(500).send({
      message,
      code: responseCode.error,
    });
  },
  isEmpty: (data) => {
    let returnObj = false;
    if (
      typeof data === "undefined" ||
      data === null ||
      data === "" ||
      data.length === 0
    ) {
      returnObj = true;
    }
    return returnObj;
  },
  throwError: (errorMessage) => {
    throw new Error(errorMessage);
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
      console.log("decryptedPwd", decryptedPwd);
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
    let otpVal = 0;
    try {
      if (Number(userObj.mobileNo) === 9876543210) {
        // later we can do email otp verification also. this case if for the tester account bypass
        otpVal = "135799";
      } else {
        otpVal = Math.floor(Math.random() * (999999 - 100000)) + 100000;
      }
      otpVal = "135799"; // this is temparoty solution, once integrate sms gateway, need to remove this one
    } catch (err) {
      console.error(err);
    }
    console.log("return otp= " + otpVal);
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
        var bucket = awsConfig.aws.bucket + "/" + req.body.bucketName;

        // ends here
        var attachmentObj = req.files.attachment;
        if (Array.isArray(attachmentObj)) {
          for (var i = 0; i < attachmentObj.length; i++) {
            var attachmentName =
              Date.now() + "_" + attachmentObj[i].originalname;
            attachmentUrlArray.push(
              link.concat(bucket + "/" + encodeURIComponent(attachmentName))
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
          var attachmentName = Date.now() + "_" + attachmentObj.originalname;
          //  attachmentUrl = link.concat(bucket + '/' + attachmentName);
          attachmentUrlArray.push(
            link.concat(bucket + "/" + encodeURIComponent(attachmentName))
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
              Date.now() + "_" + attachmentObj[i].originalname;
            attachmentUrlArray.push(
              link.concat(bucket + "/" + encodeURIComponent(attachmentName))
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
          var attachmentName = Date.now() + "_" + attachmentObj.originalname;
          //  attachmentUrl = link.concat(bucket + '/' + attachmentName);
          attachmentUrlArray.push(
            link.concat(bucket + "/" + encodeURIComponent(attachmentName))
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
              Date.now() + "_" + attachmentObj[i].originalname;
            attachmentUrlArray.push(
              link.concat(bucket + "/" + encodeURIComponent(attachmentName))
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
          var attachmentName = Date.now() + "_" + attachmentObj.originalname;
          //  attachmentUrl = link.concat(bucket + '/' + attachmentName);
          attachmentUrlArray.push(
            link.concat(bucket + "/" + encodeURIComponent(attachmentName))
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
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  },

  getStartAndEndOfMoth: (currentDate) => {
    // Get the start of the month
    const startOfMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    );

    // Get the end of the month
    const nextMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth() + 1,
      1
    );
    const endOfMonth = new Date(nextMonth - 1);

    return {
      startOfMonth: startOfMonth / 1000,
      endOfMonth: endOfMonth / 1000,
    };
  },

  getStartAndEndOfTheWeek: (currentDate) => {
    // Calculate the day of the week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const dayOfWeek = currentDate.getDay();

    // Calculate the start of the week (Sunday)
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    // Calculate the end of the week (Saturday)
    const endOfWeek = new Date(currentDate);
    endOfWeek.setDate(currentDate.getDate() + (6 - dayOfWeek));

    return { startOfWeek: startOfWeek / 1000, endOfWeek: endOfWeek / 1000 };
  },

  getStartAndEndOfDay: (currentDate) => {
    // Get the start of the day
    const startOfDay = new Date(currentDate);
    startOfDay.setHours(0, 0, 0, 0);

    // Get the end of the day
    const endOfDay = new Date(currentDate);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay: startOfDay / 1000, endOfDay: endOfDay / 1000 };
  },
  getLocation: async (req, res, next) => {
    var axios = require("axios");
    var config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${awsConfig.googleApis.locationsApi}?input=${req.query.keyword}&key=${awsConfig.googleApis.apiKey}`,
      headers: {},
    };
    try {
      const data = await axios(config);
      let result = data?.data;
      module.exports.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      module.exports.sendError(req, res, next, err);
    }
  },

  getCoordinates: async (req, res, next) => {
    var axios = require("axios");
    var config = {
      method: "GET",
      maxBodyLength: Infinity,
      url: `${awsConfig.googleApis.coordinatesApi}?place_id=${req.query.place_id}&key=${awsConfig.googleApis.apiKey}`,
      headers: {},
    };
    try {
      const data = await axios(config);
      let result = data?.data;
      module.exports.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      module.exports.sendError(req, res, next, err);
    }
  },
};
