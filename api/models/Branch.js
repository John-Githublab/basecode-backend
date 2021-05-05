let mongoose = require('mongoose');

let branchSchema = mongoose.Schema({
  corporateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Corporate'
  },
  title: { // campus name for easy search
    type: String,
    default: "",
  },
  icon:String,
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
    default: 'India',
  },
  pin: {
    type: String,
    default: '',
  },
  fragmentedAddress: {
    type: String,
    default: '',
  },
  location: {
    type: {
      type: String,
      default: "Point",
    },
    coordinates: {
      //user input lat and long [{long:""},{lat: ""}]
      type: Array,
      default: [0, 0],
    },
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
  collection: 'branches'
});

module.exports = mongoose.model('Branch', branchSchema);
