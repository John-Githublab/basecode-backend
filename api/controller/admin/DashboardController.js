let request = require('request');
let mongoose = require('mongoose');
const returnCode = require('../../../config/responseCode').returnCode;
const Order = require('./../../models/Order');
const User = require('./../../models/User');
const Case = require('./../../models/Case');

const Advertisement = require('../../models/Advertisement');
const NotificationController = require('../services/NotificationController');
const UtilController = require('../services/UtilController');

module.exports = {
  query: async (req, res, next) => {
    try {
      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getOrderStatusCount: async (req, res, next) => {
    try {
      let queryObj = { active: true };
      if (req.body.startDate) {
        queryObj['active'] = true;
        queryObj['createdAt'] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };
      }
      let result = await Order.aggregate([
        {
          $match: queryObj,
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]);
      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getOrderTypesCount: async (req, res, next) => {
    try {
      let queryObj = { active: true };
      if (req.body.startDate) {
        queryObj['active'] = true;
        queryObj['createdAt'] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };
      }
      let result = await Order.aggregate([
        {
          $match: queryObj,
        },
        {
          $group: {
            _id: '$orderType',
            count: { $sum: 1 },
          },
        },
      ]);
      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getOrderModeCount: async (req, res, next) => {
    console.log('dashboard', req.body);
    try {
      let queryObj = { active: true };
      if (req.body.startDate) {
        queryObj['active'] = true;
        queryObj['createdAt'] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };
      }
      let result = await Order.aggregate([
        {
          $match: queryObj,
        },
        {
          $group: {
            _id: '$paymentMode',
            count: { $sum: 1 },
          },
        },
      ]);
      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getNewCustomerCount: async (req, res, next) => {
    let result = {};
    var months = [
      '01',
      '02',
      '03',
      '04',
      '05',
      '06',
      '07',
      '08',
      '09',
      '10',
      '11',
      '12',
    ];
    dateObj = new Date();
    var currentYear = dateObj.getFullYear();
    var currentMonth = months[dateObj.getMonth()] - 1;
    var currentDay = dateObj.getDate();

    var startTime;
    var edTime = new Date(
      currentYear,
      currentMonth,
      currentDay,
      '23',
      '59',
      '59'
    );
    var endTime = edTime.getTime() / 1000; // Unix timestamp

    console.log('new customer', req.body);
    try {
      let queryObj = { active: true, userType: 'user' };

      if (req.body.startDate) {
        queryObj['createdAt'] = {
          $gt: req.body.startDate,
          $lt: req.body.endDate,
        };

        console.log('1', queryObj);
        result = await User.aggregate([
          {
            $match: queryObj,
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format:
                    req.body.duration == 'month'
                      ? '%m-%Y'
                      : req.body.duration == 'year'
                      ? '%Y'
                      : '%m-%d',
                  date: {
                    $toDate: {
                      $multiply: [1000, '$createdAt'],
                    },
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]);
      } else if (req.body.duration) {
        if (req.body.duration == 'day') {
          var stTime = new Date(
            currentYear,
            currentMonth,
            currentDay,
            '00',
            '00',
            '00'
          ); // get current date
          stTime.setDate(stTime.getDate() - 30);
          startTime = stTime.getTime() / 1000;
        }
        if (req.body.duration == 'month') {
          var year = dateObj.getFullYear();
          var stTime = new Date(year, '00', '01', '00', '00', '00');
          startTime = stTime.getTime() / 1000;
          var edTime = new Date(year, '11', '31', '23', '59', '59');
          endTime = edTime.getTime() / 1000; // Unix timestamp
        }

        queryObj['createdAt'] = {
          $gt: startTime,
          $lt: endTime,
        };

        if (req.body.duration == 'year') {
          queryObj = { active: true, userType: 'user' };
        }

        console.log('2', queryObj);
        result = await User.aggregate([
          {
            $match: queryObj,
          },
          {
            $sort: {
              createdAt: 1,
              '_id.year': 1,
              '_id.monthData': 1,
              '_id.day': 1,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format:
                    req.body.duration == 'month'
                      ? '%m-%Y'
                      : req.body.duration == 'year'
                      ? '%Y'
                      : '%m-%d',
                  date: {
                    $toDate: {
                      $multiply: [1000, '$createdAt'],
                    },
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]);
      } else {
        console.log('3', queryObj);
        var stTime = new Date(
          currentYear,
          currentMonth,
          currentDay,
          '00',
          '00',
          '00'
        );

        stTime.setDate(stTime.getDate() - 30);
        startTime = stTime.getTime() / 1000;

        queryObj['createdAt'] = {
          $gt: startTime,
          $lt: endTime,
        };

        result = await User.aggregate([
          {
            $match: queryObj,
          },
          {
            $sort: {
              createdAt: 1,
              '_id.year': 1,
              '_id.monthData': 1,
              '_id.day': 1,
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%m-%d',
                  date: {
                    $toDate: {
                      $multiply: [1000, '$createdAt'],
                    },
                  },
                },
              },
              count: { $sum: 1 },
            },
          },
        ]);
      }
      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },
  getCardValues: async (req, res, next) => {
    try {
      let queryObj = { active: true };

      let orders = await Order.countDocuments(queryObj);

      queryObj = { active: true, userType: 'user' };
      let customers = await User.countDocuments(queryObj);

      queryObj = { active: true, status: 'delivered' };
      let itemSold = await Order.countDocuments(queryObj);

      let payment = await Order.aggregate([
        {
          $group: {
            _id: 'toatal Payment',
            totalAmount: {
              $sum: '$receivedPayment',
            },
          },
        },
      ]);

      UtilController.sendSuccess(req, res, next, {
        orders,
        customers,
        itemSold,
        payment,
      });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getWebAppStats: async (req, res, next) => {
    try {
      var today = new Date(),
        oneDay = 1000 * 60 * 60 * 24,
        currentDate = Math.floor(
          new Date(new Date().setHours(0, 0, 0, 0)).getTime() / 1000
        ),
        thirtyDays = Math.floor(
          new Date(new Date(today.valueOf() - 30 * oneDay)).getTime() / 1000
        ),
        sevenDays = Math.floor(
          new Date(new Date(today.valueOf() - 7 * oneDay)).getTime() / 1000
        ),
        now = Math.floor(new Date().getTime() / 1000);

      let userResult = await User.aggregate([
        {
          $match: {
            // duration of 30 days
            active: true,
            userType: 'admin',
            createdAt: {
              $gt: thirtyDays,
              $lt: now,
            },
          },
        },
        {
          $project: {
            // specifications
            'today.new': {
              $cond: [
                {
                  $and: [{ $gt: ['$updatedAt', currentDate] }],
                },
                1,
                0,
              ],
            },

            'sevendays.new': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', sevenDays] },
                    { $lt: ['$updatedAt', now] },
                  ],
                },
                1,
                0,
              ],
            },

            'thirtydays.new': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', thirtyDays] },
                    { $lt: ['$updatedAt', now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },

        {
          $group: {
            _id: 'null',
            todaynew: { $sum: '$today.new' },

            sevendaysnew: { $sum: '$sevendays.new' },

            thirtydaysnew: { $sum: '$thirtydays.new' },
          },
        },

        {
          $project: {
            'newUser.today': '$todaynew',

            'newUser.sevendays': '$sevendaysnew',

            'newUser.thirtydays': '$thirtydaysnew',
          },
        },
      ]);

      let caseResult = await Case.aggregate([
        {
          $match: {
            // duration of 30 days
            updatedAt: {
              $gt: thirtyDays,
              $lt: now,
            },
          },
        },
        {
          $project: {
            // specifications
            'today.new': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', currentDate] },
                    { $eq: ['$status', 'new'] },
                  ],
                },
                1,
                0,
              ],
            },

            'today.assigned': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', currentDate] },
                    { $eq: ['$status', 'underReview'] },
                  ],
                },
                1,
                0,
              ],
            },
            'today.processed': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', currentDate] },
                    { $eq: ['$status', 'processed'] },
                  ],
                },
                1,
                0,
              ],
            },
            'sevendays.new': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', sevenDays] },
                    { $lt: ['$updatedAt', now] },
                    { $eq: ['$status', 'new'] },
                  ],
                },
                1,
                0,
              ],
            },
            'sevendays.assigned': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', sevenDays] },
                    { $lt: ['$updatedAt', now] },
                    { $eq: ['$status', 'underReview'] },
                  ],
                },
                1,
                0,
              ],
            },
            'sevendays.processed': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', sevenDays] },
                    { $lt: ['$updatedAt', now] },
                    { $eq: ['$status', 'processed'] },
                  ],
                },
                1,
                0,
              ],
            },
            'thirtydays.new': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', thirtyDays] },
                    { $lt: ['$updatedAt', now] },
                    { $eq: ['$status', 'new'] },
                  ],
                },
                1,
                0,
              ],
            },
            'thirtydays.assigned': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', thirtyDays] },
                    { $lt: ['$updatedAt', now] },
                    { $eq: ['$status', 'underReview'] },
                  ],
                },
                1,
                0,
              ],
            },
            'thirtydays.processed': {
              $cond: [
                {
                  $and: [
                    { $gt: ['$updatedAt', thirtyDays] },
                    { $lt: ['$updatedAt', now] },
                    { $eq: ['$status', 'processed'] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
        {
          $group: {
            _id: 'null',
            todaynew: { $sum: '$today.new' },
            todayassigned: { $sum: '$today.assigned' },
            todayprocessed: { $sum: '$today.processed' },
            sevendaysnew: { $sum: '$sevendays.new' },
            sevendaysassigned: { $sum: '$sevendays.assigned' },
            sevendaysprocessed: { $sum: '$sevendays.processed' },
            thirtydaysnew: { $sum: '$thirtydays.new' },
            thirtydaysassigned: { $sum: '$thirtydays.assigned' },
            thirtydaysprocessed: { $sum: '$thirtydays.processed' },
          },
        },
        {
          $project: {
            // specifications
            'new.today': '$todaynew',
            'review.today': '$todayassigned',
            'processed.today': '$todayprocessed',
            'new.sevendays': '$sevendaysnew',
            'review.sevendays': '$sevendaysassigned',
            'processed.sevendays': '$sevendaysprocessed',
            'new.thirtydays': '$thirtydaysnew',
            'review.thirtydays': '$thirtydaysassigned',
            'processed.thirtydays': '$thirtydaysprocessed',
          },
        },
      ]);

      let result = [];
      result.push(
        { label: 'Pharmacists registered', ...userResult[0].newUser },
        { label: 'New Cases uploaded', ...caseResult[0].new },
        { label: 'Cases under review', ...caseResult[0].review },
        { label: 'Cases Closed', ...caseResult[0].processed }
      );

      UtilController.sendSuccess(req, res, next, { result });
    } catch (err) {
      UtilController.sendError(req, res, next, err);
    }
  },

  getCaseStats: async function (req, res, next) {
    var typeDate = 'day';
    var startTime = Number(req.body.startDate);
    var endTime = Number(req.body.endDate);
    var valCaseDetails;
    var groupData;
    try {
      if (typeDate == 'day') {
        groupData = {
          _id: {
            day: {
              $dayOfMonth: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
            month: {
              $month: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
            year: {
              $year: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
            status: '$status',
          },

          updatedAt: {
            $first: {
              updatedAt: '$updatedAt',
            },
          },
          count: {
            $sum: 1,
          },
        };
      }
      if (typeDate == 'week') {
        groupData = {
          _id: {
            week: {
              $week: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
          },
          count: {
            $sum: 1,
          },
        };
      }
      if (typeDate == 'month') {
        groupData = {
          _id: {
            month: {
              $month: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
            year: {
              $year: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
          },
          count: {
            $sum: 1,
          },
        };
      }
      if (typeDate == 'year') {
        groupData = {
          _id: {
            year: {
              $year: {
                $add: [
                  new Date(0),
                  {
                    $multiply: [1000, '$updatedAt'],
                  },
                ],
              },
            },
          },
          count: {
            $sum: 1,
          },
        };
      }
      valCaseDetails = await Case.aggregate([
        {
          $match: {
            active: true,
            updatedAt: {
              $gte: startTime,
              $lte: endTime,
            },
          },
        },
        {
          $group: groupData,
        },

        {
          $project: {
            _id: {
              $concat: [
                { $convert: { input: '$_id.day', to: 'string' } },
                '-',
                { $convert: { input: '$_id.month', to: 'string' } },
                '-',
                {
                  $substr: [
                    { $convert: { input: '$_id.year', to: 'string' } },
                    2,
                    2,
                  ],
                },
              ],
            },
            updatedAt: '$updatedAt.updatedAt',
            status: '$_id.status',
            count: 1,
          },
        },
        {
          $group: {
            _id: '$_id',
            item: {
              $addToSet: {
                updatedAt: '$updatedAt',
                status: '$status',
                count: '$count',
              },
            },
          },
        },
        {
          $sort: {
            'item.updatedAt': 1,
          },
        },
      ]);

      UtilController.sendSuccess(req, res, next, {
        case: valCaseDetails,
      });
    } catch (err) {
      console.error(err);
      UtilController.sendError(req, res, next, err);
    }
  },
};
