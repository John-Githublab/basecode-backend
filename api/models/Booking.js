let mongoose = require('mongoose');

let bookingSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  corporateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Corporate'
  },
  brancheId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch'
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  bookingType: {
    type: String,
    default: 'employee' // employee or member this value can be self or other, if it is other then capture patient details
  },
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
  status: { // this is the Vaccination status  values will be Vaccinated, Not Vaccinated, Reschedule
    type: String,
    default: 'Not Vaccinated'
  },
  remark:{
    type:String,
    default:''
  },
  dosage:{ // this need to capture while booking, is it 1st or 2nd, dropdown dosage 1 and dosage 2
    type:String,
    default:''
  },
  active: {
    type: Boolean,
    default: true,
  },
  isShared:{ // this is to keep track of the sharing certificate
    type: Boolean,
    default: false,
  },
  isReported:{ // this is track the calling government api to report the regarding Vaccination
    type: Boolean,
    default: false,
  },
  observation:[{ // this will update after Vaccination, after 30 minute
    title:String,
    value:String
  }],
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
