let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Chat = require('./../../models/Chat');
const Case = require('./../../models/Case');
const Notification = require('./../../models/Notification');

const NotificationTemplate = require('./../../models/NotificationTemplate');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  getUserBasedNotifications: async (req, res, next) => {
    try {
      let result = await Notification.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.body.userId),
          },
        },

        {
          $project: {
            _id: 1,
            userId: 1,
            visibleOn: 1,
            category: 1,
            title: 1,
            body: 1,
            actionType: 1,
            senderId: 1,
            read: 1,
            actionId: 1,
            updatedAt: 1,
            createdDate: {
              $dateToString: {
                format: '%d-%m-%Y',
                date: {
                  $toDate: { $multiply: ['$updatedAt', 1000] },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'senderId',
            foreignField: '_id',
            as: 'senderId',
          },
        },

        {
          $unwind: {
            path: '$senderId',
          },
        },

        {
          $group: {
            _id: '$createdDate',
            userId: { $first: '$userId' },
            updatedAt: { $first: '$updatedAt' },
            notificationHistory: {
              $push: {
                _id: '$_id',
                label: 'Your Notification on',
                title: '$title',
                visibleOn: '$visibleOn',
                senderfname: '$senderId.fname',
                senderlname: '$senderId.lname',
                body: '$body',
                read: '$read',
                updatedAt: '$updatedAt',
              },
            },
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ]);

      result.map((results) => {
        return results.notificationHistory.reverse();
      });

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getCaseBasedNotifications: async (req, res, next) => {
    try {
      let result = await Notification.aggregate([
        {
          $match: {
            actionId: req.body.actionId,
          },
        },

        {
          $project: {
            _id: 1,
            userId: 1,
            visibleOn: 1,
            category: 1,
            title: 1,
            body: 1,
            actionType: 1,
            senderId: 1,
            read: 1,
            actionId: 1,
            updatedAt: 1,
            createdDate: {
              $dateToString: {
                format: '%d-%m-%Y',
                date: {
                  $toDate: { $multiply: ['$updatedAt', 1000] },
                },
              },
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'senderId',
            foreignField: '_id',
            as: 'senderId',
          },
        },

        {
          $unwind: {
            path: '$senderId',
          },
        },

        {
          $group: {
            _id: '$createdDate',
            userId: { $first: '$userId' },
            updatedAt: { $first: '$updatedAt' },
            notificationHistory: {
              $push: {
                _id: '$_id',
                label: 'Your Notification on',
                title: '$title',
                visibleOn: '$visibleOn',
                senderfname: '$senderId.fname',
                senderlname: '$senderId.lname',
                body: '$body',
                read: '$read',
                updatedAt: '$updatedAt',
              },
            },
          },
        },
        {
          $sort: {
            updatedAt: -1,
          },
        },
      ]);

      result.map((results) => {
        return results.notificationHistory.reverse();
      });

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getNotificationTemplate: async (req, res, next) => {
    try {
      let result = await NotificationTemplate.find({
        notificationType: 'notice',
      }).sort({
        updatedAt: -1,
      });

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  createNotifications: async (req, res, next) => {
    try {
      let notificationsList = req.body.notificationList;
      for (j = 0; j < notificationsList.length; j++) {
        for (let i = 0; i < notificationsList[j].actionIds.length; i++) {
          if (notificationsList[j].actionIds[i] !== undefined) {
            let caseResult = await Case.findByIdAndUpdate(
              notificationsList[j].actionIds[i],
              { updatedAt: Math.floor(Date.now() / 1000) }
            )
              .select('-medicineList -doctor')
              .populate(
                'userId',
                'fname lname email mobileNo fcmToken caregiver'
              )
              .lean();

            Object.keys(caseResult.userId).map((key, values) => {
              caseResult[key] = caseResult.userId[key];
            });

            notificationsList[j]['data'] = caseResult;
            notificationsList[j]['notificationType'] = 'notice';
            notificationsList[j]['mobileNo'] = caseResult.userId.mobileNo;
            notificationsList[j]['fcmId'] = caseResult.userId.fcmToken;
            notificationsList[j]['senderId'] = req.session.userId;
            notificationsList[j]['email'] = caseResult.userId.email;
            notificationsList[j]['userId'] = caseResult.userId._id;
            notificationsList[j]['mobileNo'] = caseResult.userId.mobileNo;
            notificationsList[j]['actionId'] =
              notificationsList[j].actionIds[i];
          }
          NotificationController.sendUserNotification(notificationsList[j]);
        }
      }

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  createUserNotifications: async (req, res, next) => {
    try {
      let createObj = req.body;

      createObj['data'] = createObj.data;
      createObj['notificationType'] = 'user';
      createObj['mobileNo'] = createObj.data.mobileNo;
      createObj['fcmId'] = createObj.data.fcmToken;
      createObj['senderId'] = req.session.userId;
      createObj['email'] = createObj.data.email;
      createObj['userId'] = createObj.data._id;
      createObj['actionId'] = '';

      NotificationController.sendUserNotification(createObj);

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  retireNotifiation: async (req, res, next) => {
    try {
      let checkNotificaiton = await Notification.findOne({
        _id: mongoose.Types.ObjectId(req.body.recordId),
        visibleOn: {
          $in: ['home'],
        },
      });

      if (checkNotificaiton !== null) {
        await Notification.findByIdAndUpdate(req.body.recordId, {
          read: req.body.read,
          visibleOnHome: req.body.read,
          updatedAt: Math.floor(Date.now() / 1000),
        });
      } else {
        await Notification.findByIdAndUpdate(req.body.recordId, {
          read: req.body.read,
          updatedAt: Math.floor(Date.now() / 1000),
        });
      }

      UtilController.sendSuccess(req, res, next, {});
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};
