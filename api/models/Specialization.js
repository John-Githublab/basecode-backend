let mongoose = require('mongoose');
// this model will help to list all symptoms and services under one specialization, this will help for search based on symptoms
let specializationSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    symptoms: Array, // list of symptoms
    services:Array, // list of service under this specialization,
    operatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    updatedAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000)
    },
  },
  {
    // this block will use when do we need to specify collection name. collection name should be case sensitive
    //otherwise model plural name consider as collection name
    collection: 'specializations',
  }
);
module.exports = mongoose.model('Specialization', specializationSchema);
