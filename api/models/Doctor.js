let mongoose = require('mongoose');
const mongoose_fuzzy_searching = require('mongoose-fuzzy-searching');

let doctorSchema = mongoose.Schema({
  name: {
    type: String,
    default: '',
  },
  description:{ // short note on doctor,
    type:String,
    default:''
  },
  active: {
    type: Boolean,
    default: true,
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

  profileImg: {
    // this is the doctor profile image,
    type: String,
    default: '',
  },
  gender: {
    type: String,
    default: '',
  },
  education:[{ // this is to capture education details like MBBS, or MD in which collage and
    year:String,
    college:String,
    course:String,
    specialization:String
  }],
  experience:[{ // this is to capture education details like MBBS, or MD in which collage and
    startAt:String,
    endAt:String,
    clinic:String, // this is clinic or hospital
    specialization:String
  }],
  award: [{ // award or recognization
  title: String, // title or description to award or recognization
  year: Number,
  certificates: String
}],
  qualification: {
    // this is the education like , MBBS, MD , BAM, make it tags
    type: String,
    default: '',
  },
  speciality:{ // this value will be like category filter, like Dental care, Child specialist etc, this will help for search by specialist
    type: String,
    default: '',
  },
  specialization: {
    // like  Allergy & Clinical Immunology.Anesthesiology.Clinical Pathology.Community Medicine/Public Health.Dermatology, Venereology and Leprosy.
    type: String,
    default: '',
  },
  otherSpecialization: {
    //we will have this field if the specialization is other
    type: String,
    default: '',
  },
  membership:Array,
  registration:String,
  licenseNo: {
    // this is doctor license
    type: String,
    default: '',
  },
  designation: {
    // like director, hod
    type: String,
    default: '',
  },
  services:Array, // this is the available service list, Array of String
  contact: {
    email: {
      type: String,
      default: '',
    },
    fax: {
      type: String,
      default: '',
    },
    mobileNo: {
      type: String,
      default: '',
    },
    alternativeNo: {
      type: String,
      default: '',
    },
    extension: {
      type: String,
      default: '',
    },
    officeNo: {
      type: String,
      default: '',
    },
  },
  township: { // In india,it's like a area
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
  socialMedia:[{
    platform:String, // this will be like a facebook, linkedIn etc
    siteLink:String
  }],
  operatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  updatedAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'doctors',
});
doctorSchema.index({
  "location": "2dsphere"
});
doctorSchema.plugin(mongoose_fuzzy_searching, {
  fields: ['name', 'specialization'],
});
module.exports = mongoose.model('Doctor', doctorSchema);
