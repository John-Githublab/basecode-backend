let mongoose = require('mongoose');
const mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");

let faqSchema = mongoose.Schema({
  question: String,
  answer: String,
  category: String,
  active: {
    type: Boolean,
    default: true,
  },
  like:{ //this is to track how many peopel liked this content or not, to get the count, do length of this parameter
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  dislike:{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  operatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  collection: 'faqs'
});
faqSchema.plugin(mongoose_fuzzy_searching, {
  fields: ["question"],
});
module.exports = mongoose.model('Faq', faqSchema);
