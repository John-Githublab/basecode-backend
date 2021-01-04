let request = require('request');
let mongoose = require('mongoose');
var Excel = require('exceljs');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Advertisement = require('./../../models/Advertisement');
const Notification = require('./../../models/Notification');
const DataFileUpload = require('./../../models/DataFileUpload');
const UploadedDatafileProcessing = require('./../services/UploadedDatafileProcessing');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  queryAdvertisement: async (req, res, next) => {
    try {
        let currentTime = Math.floor(Date.now() / 1000);
        let queryObj = {
            active:true,
            startAt: {
                "$lte": currentTime
              },
              endAt: {
                "$gte": currentTime
              },

        }
        queryObj['$and'] = [{
          typeOfLink: {
            $in: ["internal","external"]
          }
        }]

          let planResult = await Advertisement.find(queryObj).select('title images siteLink category typeOfLink subCategory searchKey').sort({
            //isTemplate: -1,
            updatedAt: -1
          }).skip(req.body.page * req.body.pageSize).limit(req.body.pageSize);
          let pageCount = await Advertisement.countDocuments(queryObj);
          let notificationCount = await Notification.countDocuments({read:false,userId:mongoose.Types.ObjectId(req.session.userId)});
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            notificationCount:notificationCount,
            pages: Math.ceil(pageCount / req.body.pageSize)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  queryProductAdvertisement: async (req, res, next) => {
    try {
        let currentTime = Math.floor(Date.now() / 1000);
        let queryObj = {
            active:true,
            startAt: {
                "$lte": currentTime
              },
              endAt: {
                "$gte": currentTime
              },
            typeOfLink:'product'
        }

          let planResult = await Advertisement.find(queryObj).select('title images siteLink category typeOfLink subCategory products').populate('products','title images price discount tax').sort({
            //isTemplate: -1,
            updatedAt: -1
          }).skip(req.body.page * req.body.pageSize).limit(req.body.pageSize);
          let pageCount = await Advertisement.countDocuments(queryObj);
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            pages: Math.ceil(pageCount / req.body.pageSize)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  ProductAdvertisementDetails: async (req, res, next) => {
    try {


          let planResult = await Advertisement.findById({
            _id:mongoose.Types.ObjectId(req.query.recordId),
          }).select('title images siteLink category typeOfLink subCategory products').populate('products','title company category subCategory images itemType price discount tax available')

          UtilController.sendSuccess(req, res, next, {
            result: planResult,
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  AdvertisementClick: async (req, res, next) => {
    try {


          await Advertisement.findOneAndUpdate({
            _id:mongoose.Types.ObjectId(req.query.recordId),
          },{

            $inc: { totalClick: 1,pageViews: 1}
          })

          UtilController.sendSuccess(req, res, next, {

          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  queryBannerAdvertisement: async (req, res, next) => {
    try {
        let currentTime = Math.floor(Date.now() / 1000);
        let queryObj = {
            active:true,
            startAt: {
                "$lte": currentTime
              },
              endAt: {
                "$gte": currentTime
              },
            typeOfLink:'banner'
        }

          let planResult = await Advertisement.find(queryObj).select('title images siteLink category typeOfLink subCategory bannerList').sort({
            //isTemplate: -1,
            updatedAt: -1
          }).skip(req.body.page * req.body.pageSize).limit(req.body.pageSize);
          let pageCount = await Advertisement.countDocuments(queryObj);
          UtilController.sendSuccess(req, res, next, {
            rows: planResult,
            pages: Math.ceil(pageCount / req.body.pageSize)
          });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  queryAllNotification: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (!(req.query.pageNo === undefined || req.query.pageNo === null || req.query.pageNo.length === 0)) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
        let result = await Notification.find({
          userId: mongoose.Types.ObjectId(req.session.userId),
        }).sort({updatedAt:-1}).skip(skipVal).limit(pageLength);
        UtilController.sendSuccess(req, res, next, {
          result
        });
      } catch (err) {
        UtilController.sendError(req, res, next, err);
      }
  },
  queryHomeNotification: async (req, res, next) => {
    try {

        let result = await Notification.find({
          userId: mongoose.Types.ObjectId(req.query.userId),
          visibleOn:{
            $in:["home"]
          },
          visibleOnHome:false
        }).sort({updatedAt:-1});
        let pageCount = await Notification.countDocuments({
          userId: mongoose.Types.ObjectId(req.query.userId),
          visibleOn:{
            $in:["app"]
          },
          read:false
        });
        UtilController.sendSuccess(req, res, next, {
          result,
          notificationCount:pageCount
        });
      } catch (err) {
        UtilController.sendError(req, res, next, err);
      }
  },

  queryInappNotification: async (req, res, next) => {
    try {
      let pageLength = 10;
      let skipVal = 0;
      if (
        !(
          req.query.pageNo === undefined ||
          req.query.pageNo === null ||
          req.query.pageNo.length === 0
        )
      ) {
        skipVal = pageLength * Number(req.query.pageNo);
      }
        let result = await Notification.find({
          userId: mongoose.Types.ObjectId(req.query.userId),
          visibleOn:{
            $in:["app"]
          },
          read:false
        }).sort({updatedAt:-1}).skip(skipVal)
        .limit(pageLength);;
        let pageCount = await Notification.countDocuments({
          userId: mongoose.Types.ObjectId(req.query.userId),
          visibleOn:{
            $in:["app"]
          },
          read:false
        });
        UtilController.sendSuccess(req, res, next, {
          result,
          notificationCount:pageCount
        });
      } catch (err) {
        UtilController.sendError(req, res, next, err);
      }
  },
  markAsRead: async (req, res, next) => {
    try {
        
          
          let result=[]
         
          if(req.query.type==="home"){
            
            await Notification.findByIdAndUpdate(req.query.recordId,{
              visibleOnHome:true
            })
            result = await Notification.find({
              userId: mongoose.Types.ObjectId(req.query.userId),
              visibleOn:{
                $in:[req.query.type]
              },
              visibleOnHome:false
            }).sort({updatedAt:-1});
            
          }else{
            
            await Notification.findByIdAndUpdate(req.query.recordId,{
              read:true
            })
          }
          
       
        UtilController.sendSuccess(req, res, next, {
          result
        });
      } catch (err) {
        UtilController.sendError(req, res, next, err);
      }
  }
}
