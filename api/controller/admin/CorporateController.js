let request = require("request");
let fs = require("fs");
let mongoose = require("mongoose");
var CryptoJS = require("crypto-js");
const NodeCache = require("node-cache");
const connection = require("../../../config/connection");
const User = require("../../models/User");
const Corporate = require("../../models/Corporate");
const DataFileUpload = require("../../models/DataFileUpload");
const configuration = require("../../../config/configuration");
const NotificationController = require("../services/NotificationController");
const UtilController = require("../services/UtilController");
const returnCode = require("../../../config/responseCode").returnCode;
var passwordSecretKey = "Admin@2O$0"; // (pimarq)this is standerd key to generate password

const systemCache = new NodeCache({
  stdTTL: 3600,
  checkperiod: configuration.login.otpValidation,
});

module.exports = {
  getAllOrganization: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;

      let queryObj = {
        active: true,
      };

      if (!UtilController.isEmpty(searchKey)) {
        queryObj["$or"] = [
          {
            title: {
              $regex: searchKey,
              $options: "i",
            },
          },
          {
            organization: {
              $regex: searchKey,
              $options: "i",
            },
          },
        ];
      }

      let sortOrder = {};
      if (req.body.sortOrder !== "" && req.body.sortField !== "") {
        sortOrder[req.body.sortField] = req.body.sortOrder === "false" ? -1 : 1;
      } else {
        sortOrder = {
          updatedAt: -1,
        };
      }

      console.log("query", queryObj);
      let result = await Corporate.find(queryObj)
        .populate("operatedBy")

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

  createOrganization: async (req, res, next) => {
    try {
      console.log("reaching");
      let createObj = req.body;
      let operatedBy = req.session.userId;

      let organizationResult = await Corporate.count({
        title: req.body.title,
        active: true,
      });

      let subDomainCheck = await Corporate.count({
        subDomain: req.body.subDomain,
        active: true,
      });

      if (organizationResult === 0) {
        if (subDomainCheck === 0) {
          if (UtilController.isEmpty(req.body.parentName)) {
            createObj["parentName"] = null;
          }
          createObj["createdAt"] = Math.floor(Date.now() / 1000);
          createObj["updatedAt"] = Math.floor(Date.now() / 1000);
          createObj["operatedBy"] = operatedBy;
          console.log(createObj);
          await Corporate.create(createObj);
          UtilController.sendSuccess(req, res, next, {});
        } else {
          UtilController.sendSuccess(req, res, next, {
            responseCode: returnCode.notAvailable,
          });
        }
      } else {
        UtilController.sendSuccess(req, res, next, {
          responseCode: returnCode.duplicate,
        });
      }
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  updateOrganization: async (req, res, next) => {
    try {
      console.log("reaching");
      let updateObj = req.body;

      let organizationResult = await Corporate.count({
        title: req.body.title,
        active: true,
        _id: { $ne: req.body.recordId },
      });

      let subDomainCheck = await Corporate.count({
        subDomain: req.body.subDomain,
        active: true,
        _id: { $ne: req.body.recordId },
      });

      if (organizationResult === 0) {
        if (subDomainCheck === 0) {
          updateObj["updatedAt"] = Math.floor(Date.now() / 1000);
          // console.log(updateObj);
          await Corporate.findByIdAndUpdate(updateObj.recordId, updateObj);
          UtilController.sendSuccess(req, res, next, {});
        } else {
          UtilController.sendSuccess(req, res, next, {
            responseCode: returnCode.notAvailable,
          });
        }
      } else {
        UtilController.sendSuccess(req, res, next, {
          responseCode: returnCode.duplicate,
        });
      }
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  deleteOrganization: async (req, res, next) => {
    try {
      const organizationId = req.body.organizationId;
      await Corporate.findByIdAndUpdate(organizationId, { active: false });
      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  queryTitle: async (req, res, next) => {
    try {
      let queryObj = { active: true };

      let org = await Corporate.findById(req.session.organizationId);
      // console.log("org", org);

      if (
        !UtilController.isEmpty(org) &&
        org.isParent &&
        !req.session.isSuperAdmin
      ) {
        queryObj["$or"] = [
          {
            _id: req.session.organizationId,
          },
          { parentName: req.session.organizationId },
        ];
      } else if (
        !UtilController.isEmpty(org) &&
        !org.isParent &&
        !req.session.isSuperAdmin
      ) {
        queryObj["_id"] = req.session.organizationId;
      }

      console.log("query..", queryObj);

      let organizations = await Corporate.find(queryObj).select("title");

      UtilController.sendSuccess(req, res, next, {
        organizations,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getOrganizationById: async (req, res, next) => {
    try {
      let result = await Corporate.findById(req.body.recordId);

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getParentOrganizationsTitle: async (req, res, next) => {
    try {
      let result = await Corporate.find({
        active: true,
        isParent: true,
      }).select("title");

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};
