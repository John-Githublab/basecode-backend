let mongoose = require("mongoose");

let orderSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    assignedId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    rfidTag: {
      type: String,
      default: "",
    },
    barCodeId: {
      type: String,
      default: "",
    },
    orderId: {
      type: String,
      default: "",
    },
    doctorName: {
      type: String,
      default: "",
    },
    designation: {
      type: String,
      default: "",
    },
    deliveryOtp: {
      // this otp will get generate once order is shipped, and ready for delivery. customer has to provide this otp to confirm order
      type: String,
      default: "",
    },
    userName: {
      type: String,
      required: true,
    },

    intakeDetails: {
      type: String,
      required: "",
    },
    schedule: {
      type: String,
      required: "",
    },
    instructions: {
      type: String,
      required: "",
    },

    mobileNo: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    isConfirmed: {
      // this will be confirmed from user side, this will be consider while uploading proscription
      type: Boolean,
      default: true,
    },
    isVerified: {
      // once admin verify prescription and add all items into list
      type: Boolean,
      default: true,
    },
    isRefundable: {
      // if this flag is true then only for those order, we can do refund else after cancel aslo will not do refund
      type: Boolean,
      default: false,
    },
    status: {
      type: String, // enquiry,verified,placed,delivered,cancelled,refunded
      default: "",
    },
    processStage: {
      type: String,
      default: "",
    },
    orderType: {
      // generic,prescription,otc , this is to distinguest product type, so that we can restrict user to purchase all kind of product without restriction
      type: String,
      default: "",
    },
    prescription: Array, // this is the doctor prescription
    invoiceId: {
      type: String,
      default: "",
    },
    tagNumber: {
      type: String,
      default: "",
    },
    paymentDone: {
      type: Boolean,
      default: false,
    },
    paymentMode: {
      type: String,
      default: "", // online or cash , check
    },
    paymentRefId: {
      type: String,
      default: "",
    },
    paymentProof: {
      description: {
        type: String,
        default: "",
      },
      path: {
        type: String,
        default: "",
      },
    },
    payment: {
      // this is overall generated payment
      type: Number,
      default: 0,
    },
    receivedPayment: {
      // this is received payment after discount
      type: Number,
      default: 0,
    },
    coupon: {
      type: String,
      default: "",
    },
    discount: {
      type: Number,
      default: 0,
    },
    itemCount: {
      type: Number,
    },
    deliveryCharge: {
      type: Number,
      default: 0,
    },
    itemList: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
        itemName: {
          type: String,
        },
        schedule: {
          type: String,
          default: "",
        },
        instructions: {
          type: String,
          default: "",
        },
        intakeDetails: {
          type: String,
          default: "",
        },
      },
    ],
    removedItemList: [
      {
        // this will consider,if any item is removed while doing verification or without prescription if they ordered.
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Inventory",
        },
        itemCount: {
          type: Number,
        },
      },
    ],
    trackId: {
      type: String,
      default: "",
    },
    trackingUrl: {
      type: String,
      default: "",
    },
    address: {
      landMark: {
        type: String,
      },
      pin: {
        type: String,
      },
      fragmentedAddress: {
        // this will be the complete address
        type: String,
      },
      latitude: {
        type: Number,
        default: 0,
      },
      longitude: {
        type: Number,
        default: 0,
      },
    },
    operaterLog: [
      {
        // this is to keep track of each operation by multiple user,
        status: String, // this is the order status, like confirmed,delivered etc
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        updatedAt: Number,
      },
    ],
    operatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }, // we can define modules for each plan subscribe, there modules will add defaultly, later can change if they need
    review: {
      rating: {
        type: Number,
      },
      feedback: {
        type: String,
      },
      comment: {
        type: String,
      },
      updatedAt: {
        type: Number,
      },
      prescriptionDate: {
        type: Number,
      },
    },
    updatedAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
    createdAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
    },
  },
  {
    // this block will use when do we need to specify collection name. collection name should be case sensitive
    //otherwise model plural name consider as collection name
    collection: "orders",
  }
);
module.exports = mongoose.model("Order", orderSchema);
