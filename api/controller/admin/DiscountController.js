const User = require('./../../models/User');
const Order = require('./../../models/Order');
const Center = require('./../../models/Center');
const Discount = require('./../../models/Discount');

const Setting = require('./../../models/Setting');
let mongoose = require('mongoose');

module.exports = {

  discountPage: async function(req, res, next) {
    var result;
    var centerList;
    try {
      result = await User.find({
        mobileNo: req.session.mobileNo,
        //userType: 'executive',
        userType: {
          $in: ['executive', 'agent']
        },
        active: true
      }).populate('permission');
      res.render('discount', {
        user: {
          userName: result[0].userName,
          userType: result[0].userType
        },
        permission: result[0].permission,
        pageTitle: "Discount Information"
      });
    } catch (err) {
      console.error(err);
      res.render('login', {
        user: {
          title: 'Express'
        }
      });
    }
  },

  discountsQuery: async function(req, res, next) {
    var startDate = req.body.startDate;
    var endDate = req.body.endDate;
    var reqQueryObj = req.body.condition;
    var center = req.body.center;
    var queryObj = {};
    if (!(center == null || center == undefined)) {
      queryObj['center'] = mongoose.Types.ObjectId(center);
    }

    if (!(reqQueryObj.coupon == 'undefined' || reqQueryObj.coupon == null)) {
      queryObj['coupon'] = reqQueryObj.coupon;
    }
    if (!(reqQueryObj.active == 'undefined' || reqQueryObj.active == null)) {
      if (reqQueryObj.active == 'true') {
        queryObj['active'] = true;
      } else {
        queryObj['active'] = false;
      }
    }

    if (!(reqQueryObj.publish == 'undefined' || reqQueryObj.publish == null)) {
      if (reqQueryObj.publish == 'true') {
        queryObj['publish'] = true;
      } else {
        queryObj['publish'] = false;
      }
    }

    /*if (!(startDate == null || startDate == undefined)) {
         queryObj['createdAt'] = {
           "$gte": startDate,
           "$lte": endDate
         };
       }*/

    var result;
    try {
      result = await Discount.aggregate([{
        $match: queryObj
      }, {
        $project: {
          _id: 1,
          title: 1,
          coupon: 1,
          noAttempts: 1,
          noCustomer: 1,
          applicableType: 1,
          active: 1,
          publish: 1,
          minAmount: 1,
          maxAmount: 1,
          percentage: 1,
          eligibleCustomer: {
            $size: "$eligibleCustomer"
          },
          appliedCustomer: {
            $size: "$appliedCustomer"
          },
          totalDiscount: {
            $sum: "$appliedCustomer.discountedAmt"
          },
          createdAt: 1,
          startAt: 1,
          endAt: 1

        }
      }]);
      // check the query data is available or not
      if (result.length > 0) {
        res.status(200).send({
          discount: result,
          status: 'success',
          code: 1
        });
      } else {
        res.status(200).send({
          status: 'success',
          code: 4,
          message: 'Records not found'
        });
      }
    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: 'failure',
        code: 6,
        errorCode: err.code,
        message: err.message
      });
    }
  },

  discountAdd: async function(req, res, next) {
    try {
      req.body.coupon = req.body.coupon_val;
      req.body.createdAt = Math.floor(Date.now() / 1000);
      await Discount.create(req.body);
      res.redirect('/discount');

    } catch (err) {
      res.render('winkwash-error', {
        title: 'Winkwash',
        status: 'failure',
        code: 6,
        message: 'Error is occurred in Discount page, you have Entered invalid data, pleaes contact respected person to resolve this issue',
        errorCode: err.code,
        errorMessage: err.message
      });
    }

  },
  discountEdit: async function(req, res, next) {
    try {
      req.body.coupon = req.body.coupon_val;
      await Discount.findByIdAndUpdate(req.body.discountId, req.body);
      //await Discount.create(req.body);
      res.redirect('/discount');

    } catch (err) {
      res.render('winkwash-error', {
        title: 'Winkwash',
        status: 'failure',
        code: 6,
        message: 'Error is occurred in Discount page, you have Entered invalid data, pleaes contact respected person to resolve this issue',
        errorCode: err.code,
        errorMessage: err.message
      });
    }
  },
  discountDelete: async function(req, res, next) {
    var result;
    try {
      var discountId = req.body.discountId;
      var updateObj = {
        active: false
      };
      result = await Discount.findByIdAndUpdate(discountId, updateObj);
      res.status(200).send({
        status: 'success',
        code: 1
      });
    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: 'failure',
        code: 6,
        errorCode: err.code,
        message: err.message
      });
    }
  },
  discountPublish: async function(req, res, next) {
    var result;
    try {
      var discountId = req.body.discountId;
      var coupon = req.body.coupon;
      var checkCoupon = await Discount.find({
        active: true,
        publish: true,
        coupon: coupon
      });
      if (checkCoupon.length <= 0) {
        var updateObj = {
          publish: true
        };
        result = await Discount.findByIdAndUpdate(discountId, updateObj);
        res.status(200).send({
          status: 'success',
          code: 1
        });
      } else {
        res.status(200).send({
          status: 'success',
          code: 4
        });
      }

    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: 'failure',
        code: 6,
        errorCode: err.code,
        message: err.message
      });
    }
  },
  discountStop: async function(req, res, next) {
    var result;
    try {
      var discountId = req.body.discountId;
      var updateObj = {
        publish: false
      };
      result = await Discount.findByIdAndUpdate(discountId, updateObj);
      res.status(200).send({
        status: 'success',
        code: 1
      });
    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: 'failure',
        code: 6,
        errorCode: err.code,
        message: err.message
      });
    }
  },

  getDiscountDataById: async function(req, res, next) {
    try {
      var result = await Discount.findById(req.body.discountId).populate('eligibleCustomer', '_id userName');
      res.status(200).send({
        status: 'success',
        code: 1,
        result: result
      });
    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: 'failure',
        code: 6,
        errorCode: err.code,
        message: err.message
      });
    }
  },
  discountAppliedQry: async function(req, res, next) {
    try {
      var result = await Discount.findById(req.query.discountId).populate('appliedCustomer.customerId', '_id userName mobileNo tagNumber').populate('appliedCustomer.orderId', 'orderType createdAt').select('appliedCustomer');
      res.status(200).send({
        status: 'success',
        code: 1,
        result: result
      });
    } catch (err) {
      console.error(err);
      res.status(200).send({
        status: 'failure',
        code: 6,
        errorCode: err.code,
        message: err.message
      });
    }
  }
}
