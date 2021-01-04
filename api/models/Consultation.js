let mongoose = require('mongoose');
// this is for the video consultation booking
let bookingSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  bookingType:{
    type:String,
    default:'self' // this value can be self or other, if it is other then capture patient details
  },
  relationship:{ // this will be applicable for other bookingType, basically to track booking user and patient relation
    type:String,
    default:''
  },
  name:{ // this is booked user name else patient name, this will help us to do search records based on name
    type:String,
    default:''
  },
  mobileNo:{
    type:String,
    default:''
  },
  email:{
    type:String,
    default:''
  },
  doctorId: { // this is doctor id, to whom booking as done
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  clinicId: { // this is doctor id, to whom booking as done
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Clinic'
  }, // this doctor location, where they will be available to consult
  bookingDate: { // booking date, it will be only date, this helps to find the previously booked slot on same date
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
  slotNo: {
    type: Number, // this is to keep track of each request and count
    default: 0,
  },
  slot: {
    type: String, // only to print or display the data, it will be in HH:mm:ss 09:30 am
  },
  payment: {// payment billing with any discount and other
    type: Number,
    default: 0
  },
  paymentDone: {
    type: Boolean,
    default:false
  },
  paymentMode: {
    type: String,
    default:"" // online or cash , check
  },
  paymentRefId: {
    type: String,
    default:""
  },
  paymentProof:{
    description:{
      type:String,
      default:""
    },
    path:{
      type:String,
      default:""
    },
  },
  receivedPayment:{
    type:Number,
    default:0
  },
  coupon:{
    type:String,
    default:""
  },
  discount:{
    type:Number,
    default:0
  },
  active: {
    type: Boolean,
    default: true,
  },
  updatedAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'bookings'
});
module.exports = mongoose.model('Booking', bookingSchema);
