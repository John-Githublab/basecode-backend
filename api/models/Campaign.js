let mongoose = require('mongoose');

let campaignSchema = mongoose.Schema({
    corporateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Corporate'
    },
    title: String, // title of the campaign or drive
    icon:{
      type:String,
      default:''
    },
    brancheId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch'
    },
    // address:{
    //   type:String,
    //   default:''
    // },
    instruction: {
      type: String,
      default: "",
    },
    operationSlots: [
      {
        // timeslots
        date: Number,// means campaign will be available on these days
        timeslots: [
          {
            slotNo: {
              type: Number, // this is to keep track of each request and count
              default: 0,
            },
            slot: {
              startAt: String,
              endAt: String, // only to print or display the data, it will be in HH:mm:ss
            },
            limit: {
              // this is for the slot allowcation limit. means if we give 10, max count only it should less or equal to 10.
              type: Number,
              default: 1,
            },
          },
        ],

      },
    ],
    active: {
      type: Boolean,
      default: true
    },
    publish: {
      type: Boolean,
      default: true
    },
    operatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: {
      type: Number,
      default: Math.floor(Date.now() / 1000)
    },
    updatedAt: {
      type: Number,
      default: Math.floor(Date.now() / 1000)
    }

  },
  {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
    collection: 'campaigns'
  }
);
module.exports = mongoose.model('Campaign', campaignSchema);
