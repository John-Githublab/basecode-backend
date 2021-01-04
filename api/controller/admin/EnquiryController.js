let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('../../../config/responseCode').returnCode;
const Advertisement = require('../../models/Advertisement');
const NotificationController = require('../services/NotificationController');
const UtilController = require('../services/UtilController');
const Inventory = require('./../../models/Inventory');
const User = require('./../../models/User');
const Option = require('./../../models/Option');

const Enquiry = require('./../../models/Enquiry');

module.exports = {
  queryEnquiry: async (req, res, next) => {
    try {
      let searchKey = req.body.keyword;
      let queryObj = { active: req.body.active };

      if (
        !UtilController.isEmpty(req.body.status) &&
        req.body.status !== 'all'
      ) {
        queryObj['status'] = req.body.status;
      }
      if (!UtilController.isEmpty(req.body.type) && req.body.type !== 'all') {
        queryObj['enquiryType'] = req.body.type;
      }
      if (
        !UtilController.isEmpty(req.body.startDate) &&
        !UtilController.isEmpty(req.body.endDate)
      ) {
        queryObj['createdAt'] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };
      }
      if (!UtilController.isEmpty(searchKey)) {
        queryObj['$or'] = [
          {
            ticketNo: {
              $regex: searchKey,
              $options: 'i',
            },
          },
        ];
      }

      console.log(queryObj);

      let planResult = await Enquiry.find(queryObj)
        .populate('userId', 'fname email mobileNo')
        .populate('resolved.resolver', 'fname')
        .sort({
          //isTemplate: -1,
          updatedAt: -1,
        })
        .skip(req.body.page * req.body.pageSize)
        .limit(req.body.pageSize);
      let pageCount = await Enquiry.countDocuments(queryObj);
      UtilController.sendSuccess(req, res, next, {
        rows: planResult,
        filterRecords: pageCount,
        pages: Math.ceil(pageCount / req.body.pageSize),
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getEnquiryInfoById: async (req, res, next) => {
    try {
      let eId = req.body.eId;
      let enquiry = await Enquiry.findById(eId)
        .populate('userId', 'fname email mobileNo ')
        .populate('resolved.resolver', 'fname');

      resolvename = User.findById(req.session.userId);

      console.log('update resp', enquiry, eId);

      UtilController.sendSuccess(req, res, next, {
        enquiry,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },
  updateEnquiry: async (req, res, next) => {
    try {
      let enquiry = await Enquiry.findById(req.body.eId);
      console.log('from update', enquiry, req.body.eId);
      let updateObj = req.body;
      updateObj['updatedAt'] = Math.floor(Date.now() / 1000);
      updateObj['operatedBy'] = req.session.userId;
      updateObj.resolved.resolver = req.session.userId;

      let token = await Enquiry.findOneAndUpdate(
        {
          _id: mongoose.Types.ObjectId(req.body.eId),
          // operatedBy: mongoose.Types.ObjectId(req.session.userId),
        },
        updateObj
      )
        .select('userId ticketNo status')
        .populate('userId', 'fcmToken');
      console.log('token', token);
      if (!UtilController.isEmpty(token.userId.fcmToken)) {
        NotificationController.sendFcmMessage(token.userId.fcmToken, {
          title: 'Your enquiry status is changed',
          body:
            'Status of your enquiry ' +
            token.ticketNo +
            ' is changed to ' +
            req.body.status,
          type: 'complaint',
          actionId: token._id,
          userId: token.userId._id,
        });
      }

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getOptions: async (req, res, next) => {
    let name = req.body.name;
    let queryObj = {
      name,
    };

    try {
      let options = await Option.find(queryObj);

      UtilController.sendSuccess(req, res, next, {
        options,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getMedicalOptions: async (req, res, next) => {
    try {
      let options = await Option.find({ name: 'medicalConditions' });

      console.log(options);

      UtilController.sendSuccess(req, res, next, {
        options,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};
