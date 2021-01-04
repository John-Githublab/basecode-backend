let mongoose = require('mongoose');
// this is for the clinic or hospital
let clinicSchema = mongoose.Schema({
  name:{
    type:String,
    default:''
  },
  images:[], // thsi is the clinic or hospital images. this will show in slider in clinic page
  doctors:[{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  consultationFee:{ // this will be a range and applicable to all doctors. once user reach to hospital or clinic then they will take proper fee
    type:String,
    default:0
  },
  services:Array, // this is the available service list, Array of String
  operationSlots: [
    {
      // timeslots
      day: String,
       timeslots: [
        {
          startFrom: {
            type: String,
          },
          endTo: {
            type: String,
          },// this will look like 10:00 am - 01:00 pm (from -to)
        },
      ],
      isHoliday: {
        type: Boolean,
        default: false,
      },
    },
  ],
  contact:{
    mobileNo:String,
    officeNo:String,
  },
  township: {
    type: String,
  },
  city: {
    type: String,
    default: '',
  },
  state: {
    type: String,
    default: '',
  },
  country: {
    type: String,
    default: '',
  },
  pin: {
    type: String,
    default: '',
  },
  fragmentedAddress: {
    // this will be the complete address
    type: String,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
    },
    coordinates: {
      //user input lat and long [{long:""},{lat: ""}]
      type: Array,
      default: [0, 0],
    },
  },

}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'clinics'
});
clinicSchema.index({
  "location": "2dsphere"
});
module.exports = mongoose.model('Clinic', clinicSchema);
