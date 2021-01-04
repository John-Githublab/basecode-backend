let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Enquiry = require('./../../models/Enquiry');
const Tag = require('./../../models/Tag');
const Notification = require('./../../models/Notification');
const DataFileUpload = require('./../../models/DataFileUpload');
const UploadedDatafileProcessing = require('./../services/UploadedDatafileProcessing');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  queryEnquiry: async (req, res, next) => {
    try {
        let pageLength = 10;
      let skipVal = 0;
      if (!(req.body.pageNo === undefined || req.body.pageNo === null || req.body.pageNo.length === 0)) {
        skipVal = pageLength * Number(req.body.pageNo);
      }
        let queryObj = {
            active:true,
            userId:mongoose.Types.ObjectId(req.session.userId),
            status:req.body.status,
        }

          let planResult = await Enquiry.find(queryObj).populate('resolved.resolver','name email mobileNo').sort({
            //isTemplate: -1,
            updatedAt: -1
          }).skip(skipVal).limit(pageLength);
          let pageCount = await Enquiry.countDocuments(queryObj);
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            pages: Math.ceil(pageCount / pageLength)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  createEnquiry: async (req, res, next) => {
    try {

        let createObj = {
            active:true,
            userId:mongoose.Types.ObjectId(req.session.userId),
            status:'opened',
            enquiryType:req.body.enquiryType,
            attachment:req.body.attachment,
            content:req.body.content
        }
        let tagResult = await Tag.findOneAndUpdate({
          active:true,
          tagType:'ticketNo'
        },{$inc: { sequenceNo: 1},updatedAt:Math.floor(Date.now() / 1000)} );
        createObj['ticketNo']=tagResult.prefix+UtilController.pad(tagResult.sequenceNo,5);

          await Enquiry.create(createObj)
          UtilController.sendSuccess(req, res, next, {

          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
}
