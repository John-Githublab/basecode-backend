let mongoose = require('mongoose');

let medicationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    caseId: {
      type: String,
      default: '',
    },
    processCaseId: {
      // this is mongoId of case collection and populate when ever it require
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Case',
    },

    startDate: {
      type: Number,
    },
    endDate: {
      type: Number,
    },

    forMedicalConditions: {
      //Chemist information like high blood pressure or anything.. tab based
      type: String,
    },

    prescriptionDate: {
      type: Number,
      default: Math.floor(Date.now() / 1000),
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
    },
    // no need to active and inactive status, directly add and delete record from this collection
    retire: {
      // User can toggle Include/Exclude to retire medications from the list. Retire will move the medicine to the bottom of the list and it will be in GREY background,
      type: Boolean,
      default: false,
    },
    comparePrice: {
      //user to list medicine in compare price section if true it will be listed in compare price
      type: Boolean,
      default: true,
    },
    // caseMongoId: {
    //   type: mongoose.Schema.Types.ObjectId,
    //   ref: "Case",
    // },
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory',
    },
    itemName: {
      type: String,
    },

    itemCount: {
      type: Number,
    },
    duration: {
      // this like how many days
      type: Number,
    },
    frequency: {
      // daily, weekly twice, 2 times in week, dropdown with other option, then take user input
      type: String,
      default: '',
    },
    frequencyDates: Array, //frequency dates
    whenToTake: Array, //match with time of day in UI
    // 1-0-0-1 // Dosage frequency Morning - Afternoon - Evening - Night

    strength: {
      // this is the Dosage strength like 50mg,100 mg
      type: String,
      default: '',
    },
    intakeDetails: {
      // (eg: Before, After, with meal, SOS) it is dropdown
      type: String,
      default: '',
    },

    intake: {},

    intakeQuantity: {},
    priceList: [
      {
        provider: String, // like 1mg, netmeds
        price: Number,
        discount: Number,
      },
    ],
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
    collection: 'medications',
  }
);

module.exports = mongoose.model('Medication', medicationSchema);
