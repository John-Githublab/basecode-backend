let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Faq = require('./../../models/Faq');
const Tag = require('./../../models/Tag');
const Notification = require('./../../models/Notification');
const DataFileUpload = require('./../../models/DataFileUpload');
const UploadedDatafileProcessing = require('./../services/UploadedDatafileProcessing');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  queryFaq: async (req, res, next) => {
    try {
        let pageLength = 10;
      let skipVal = 0;
      if (!(req.query.pageNo === undefined || req.query.pageNo === null || req.query.pageNo.length === 0)) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
        let queryObj = {
            active:true
        }

          let planResult = await Faq.find(queryObj).sort({
            //isTemplate: -1,
            updatedAt: -1
          }).skip(skipVal).limit(pageLength);
          let pageCount = await Faq.countDocuments(queryObj);
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            pages: Math.ceil(pageCount / pageLength)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  
}
