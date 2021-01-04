let mongoose = require('mongoose');

let enquirySchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  name:{ // these details require, if enquiry is raized for other persons
    type:String,
    default:""
  },
  mobileNo:{
    type:String,
    default:""
  },
  email:{
    type:String,
    default:""
  },
  ticketNo:{ // this is the unique number for each ticket
    type: String,
    default: ""
  },
  content:{ // this is the description from user
    type:String,
    default:""
  },
  attachment:Array,
  active:{
    type:Boolean,
    default:true
  },
  enquiryType:{ // this is the enquiry type, like callback, enquiry, compaints etc, which require admin to look into it
    type:String, 
    default:"" 
  },
  status:{   // this is the enquiry status, like opened, closed etc, which require admin to look into it
    type:String,
    default:""
  },
  resolved: {
    resolver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remark: {
      type: String,
      default: ""
    },
    attachment: Array  // this is to upload proof from resolver
  },
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
  }

}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'enquiries'
});
module.exports = mongoose.model('Enquiry', enquirySchema);
