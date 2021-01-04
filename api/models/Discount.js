let mongoose = require('mongoose');

let discountSchema = mongoose.Schema({
    title: {
      type: String
    },
    coupon: {
      type: String,
      required: true
    },
    noAttempts: {
      type: Number
    },
    noCustomer: {
      type: Number
    },
    applicableType: {
      type: String
    },
    center: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Center'
    }],
    eligibleCustomer: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    appliedCustomer: [{
      customerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order'
      },
      appliedAmt: {
        type: Number
      },
      discountedAmt: {
        type: Number
      },
    }],
    minAmount: {
      type: Number
    },
    maxAmount: {
      type: Number
    },
    percentage: {
      type: Number
    },
    active: {
      type: Boolean
    },
    publish: {
      type: Boolean
    },
    createdAt: {
      type: Number,
      index: true
      //default: Date.Now
    },
    startAt: {
      type: Number
    },
    endAt: {
      type: Number
    },

  },
  /*{
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  otherwise model plural name consider as collection name
    collection: 'workCenters'
  }*/
);
/*centerSchema.index({
  "location": "2dsphere"
});*/
module.exports = mongoose.model('Discount', discountSchema);