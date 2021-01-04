let mongoose = require('mongoose');
// user additional info
let userInfoSchema = mongoose.Schema({
  userId: { // person who has done comment on this productId
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  documents: {
    type: Array,
    default: [],
  },
  height: {
    type: Number,
    default: 0,
  },
  weight: {
    type: Number,
    default: 0,
  },
  relationship: {
    // this is the relationship with patient or caregiver, like friend, brother, sister
    type: String,
    default: '',
  },
  bloodGroup: {
    type: String,
    default: '',
  },
  bloodPressure: {
    high: {
      type: String,
      default: '0',
    },
    low: {
      type: String,
      default: '0',
    },
  },
  surgeries: {
    type: String,
    default: '',
  },
  chronicConditions: {
    type: String,
    default: '',
  },
  allergies: {
    type: String,
    default: '',
  },

  familyHistory: {
    type: String,
    default: '',
  },

  isSmoker: {
    type: Boolean,
    default: false,
  },

  alcoholIntake: {
    type: String,
    default: '',
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
    type: String,
    default: '',
  },

}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'userinfo'
});
module.exports = mongoose.model('UserInfo', userInfoSchema);
