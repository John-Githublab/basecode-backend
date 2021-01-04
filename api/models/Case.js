let mongoose = require('mongoose');

let caseSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    caseType: {
      type: String, // Prescription, lab Result
      default: 'Prescription',
    },
    userName: {
      // this same as above userId, but still require to make it search easy
      type: String,
      required: true,
    },
    weight: {
      type: Number,
      default: 0,
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

    mobileNo: {
      // this same as above userId, but still require to make it search easy
      type: String,
      required: true,
    },
    caseId: {
      // this is the system generated unique key, this will come from tag collection
      type: String,
      default: '',
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    prescriptionDate: {
      type: Number,
      default: Math.floor(Date.now() / 1000),
    },
    diagnosis: {
      type: String,
      default: '',
    },
    patientId: {
      type: String, // unique userId
      default: '',
    },
    assignedUser: {
      // this is the current one, who is handling it
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    assignedUsers: [
      {
        // this is to keep track assignedUser users list, so that later we can come back and check it here, who are all attended this case
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    status: {
      type: String, // new,underReview,enquiry,processed,cancelled
      default: 'new',
    },
    userReview: {
      type: Boolean,
      default: false,
    },

    active: {
      type: Boolean,
      default: true,
    },

    prescription: Array, // this is the doctor prescription
    medicineList: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medication',
      },
    ],
    // itemList: [{
    //   itemId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Inventory",
    //   },
    //   itemName: {
    //     type: String
    //   },
    //   itemCount: {
    //     type: Number
    //   },
    //   duration: { // this like how many days
    //     type: Number
    //   },
    //   frequency: { // 1-0-0-1 // Dosage frequency Morning - Afternoon - Evening - Night
    //     type: String,
    //     default: "",
    //   },
    //   strength:{ // this is the Dosage strength like 50mg,100 mg
    //     type: String,
    //     default: "",
    //   },
    //   intakeDetails: { // (eg: Before, After, with food, SOS) it is dropdown
    //     type: String,
    //     default: "",
    //   },
    //   priceList: [{
    //     provider: String, // like 1mg, netmeds
    //     price: Number,
    //     discount: Number
    //   }]
    // }],
    doctorInstructions: {
      //this is like come back after 15, doctors remork
      type: String,
      default: '',
    },
    pharmaInstructions: {
      //this si
      type: String,
      default: '',
    },
    remark: {
      // case handler can update some value here
      type: String,
      default: '',
    },
    patientNotes: {
      //this is like patient is adding notes for this case by user app
      type: String,
      default: '',
    },
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
  },
  {
    // this block will use when do we need to specify collection name. collection name should be case sensitive
    //otherwise model plural name consider as collection name
    collection: 'cases',
  }
);
module.exports = mongoose.model('Case', caseSchema);
