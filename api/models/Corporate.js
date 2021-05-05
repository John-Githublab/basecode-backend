let mongoose = require("mongoose");

let corporateSchema = mongoose.Schema(
  {
    title: {
      type: String,
      default: "",
    },
    active: {
      type: Boolean,
      default: true,
    },
    contact: {
      // this is the contact person details of individual corporate
      name: {
        type: String,
        default: "",
      },
      email: {
        type: String,
        default: "",
      },
      mobileNo: {
        type: String,
        default: "",
      },
      officeNo: {
        type: String,
        default: "",
      },
    },
    noOfUser: { // this is the count of employee in that corporate
      type: String,
      default: "",
    },
    familyMemberLimit:{ // this is corporate level configuration to limit each employee to add their family members
      type:Number,
      default:10
    },
    registeredAddress:String, // corporate address
    branches:[
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      }
    ],
    operatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    collection: "corporates",
  }
);
module.exports = mongoose.model("Corporate", corporateSchema);
