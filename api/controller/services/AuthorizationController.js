let request = require("request");
let mongoose = require("mongoose");
const Option = require("../../models/Option");
const User = require("../../models/User");
const Subscription = require("../../models/Subscription");
const Notification = require("../../models/Notification");
const authorization = require("./../../../config/authorization");
const connection = require("./../../../config/connection");
const UtilController = require("./../services/UtilController");

//var request = require('request');
const adminAuthList = [];
const usersAuthList = [];
const indexAuthList = [];
const languageList = [];
for (var i = 0; i < authorization.admin.authNotRequire.length; i++) {
  adminAuthList.push("/admin" + authorization.admin.authNotRequire[i]);
}
for (var x = 0; x < authorization.admin.language.length; x++) {
  languageList.push("/admin" + authorization.admin.language[x]);
}
for (var j = 0; j < authorization.user.authNotRequire.length; j++) {
  usersAuthList.push("/user" + authorization.user.authNotRequire[j]);
}
for (var y = 0; y < authorization.user.language.length; y++) {
  languageList.push("/user" + authorization.user.language[y]);
}
for (var k = 0; k < authorization.index.authNotRequire.length; k++) {
  indexAuthList.push(authorization.index.authNotRequire[k]);
}
for (var z = 0; z < authorization.index.language.length; z++) {
  languageList.push(authorization.index.language[z]);
}

module.exports = {
  checkRequestAuth: async function (req, res, next) {
    try {
      // Uses inefficient cache policy on static assets. this is added to increase page rendering speed
      // res.set('Cache-Control', 'public, max-age=31557600');
      //res.set('Cache-Control', 'public, max-age=2592000');
      // set the language if request requires it
      if (languageList.indexOf(req.path) > -1) {
      }
      // adding aws credentials in request to get it in browser side. no need to add in each router
      //res.locals.awsCognito = connection.aws.CognitoIdentityCredentials;
      // check here, authorization is there or not

      if (
        req.path.startsWith("/admin") &&
        adminAuthList.indexOf(req.path) <= -1
      ) {
        module.exports.checkAdminRequestAuth(req, res, next);
      } else if (
        req.path.startsWith("/user") &&
        usersAuthList.indexOf(req.path) <= -1
      ) {
        module.exports.checkUsersRequestAuth(req, res, next);
      }
      // else if (req.path==="/" && indexAuthList.indexOf(req.path) <= -1) {
      //   module.exports.checkIndexRequestAuth(req, res, next);
      // }
      else {
        next();
      }
    } catch (err) {
      console.error(err);
    }
  },

  checkAdminRequestAuth: async function (req, res, next) {
    try {
      if (
        typeof req.session.userId === "undefined" ||
        req.session.userId.length === null ||
        req.session.userId.length === 0
      ) {
        UtilController.sendSuccess(req, res, next, {
          responseCode: 108,
        });
      } else {
        next();
      }
      //res.locals.authenticated = true;
      // let userInfo = ""; //await Admin.findById(req.session.userId).populate('permission').select('name active profileImg mobileNo email status isSuperAdmin center').lean();
      // if (userInfo !== null && userInfo.isSuperAdmin) {
      //   // if user is super admin then controller will come here, in that case list all center for this user
      //   userInfo['center'] = await Center.find({
      //     active: true
      //   }).select('name');
      // }
      // res.locals.user = userInfo;
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  // user each request has to validate with respect to session, if user open any url or page, should be under controller
  checkUsersRequestAuth: async function (req, res, next) {
    // if (!(UtilController.isEmpty(req.session.userId) || UtilController.isEmpty(req.session.employeeId))) {
    if (UtilController.isEmpty(req.session.userId)) {
      UtilController.sendSuccess(req, res, next, {
        responseCode: 108,
      });
    } else {
      next();
    }
    //res.locals.authenticated = true;
    //  res.locals.user = await Admin.findById(req.session.userId).select('name active profileImg mobileNo email status');
  },
  checkIndexRequestAuth: async function (req, res, next) {
    try {
    } catch (err) {
    } finally {
      next();
    }
  },
  attachUserInfo: async function (req, res, next) {
    try {
    } catch (err) {
      console.error(err);
    }
  },
};
