let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('./../../../config/responseCode').returnCode;
const User = require('./../../models/User');
const Chat = require('./../../models/Chat');

const NotificationController = require('./../services/NotificationController');
const UtilController = require('./../services/UtilController');
module.exports = {
  getAllChats: async (req, res, next) => {
    try {
      let result = await Chat.aggregate([
        {
          $match: {
            userId: mongoose.Types.ObjectId(req.body.userId),
          },
        },

        {
          $project: {
            chat: 1,
            sessionId: 1,
            title: 1,
            userId: 1,
            createdAt: 1,
            createdDate: {
              $dateToString: {
                format: '%d-%m-%Y',
                date: {
                  $toDate: { $multiply: ['$createdAt', 1000] },
                },
              },
            },
          },
        },
        {
          $group: {
            _id: '$createdDate',
            userId: { $first: '$userId' },
            createdAt: { $first: '$createdAt' },
            chatHistory: {
              $push: {
                title: '$title',
                sessionId: '$sessionId',
                chat: '$chat',
                createdAt: '$createdAt',
              },
            },
          },
        },
        {
          $sort: {
            createdAt: -1,
            'chatHistory.createdAt': -1,
          },
        },
      ]);

      result.map((results) => {
        return results.chatHistory.reverse();
      });

      UtilController.sendSuccess(req, res, next, {
        result,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
};
