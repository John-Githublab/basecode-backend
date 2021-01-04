let mongoose = require('mongoose');

let optionSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    options: [
      {
        value: {
          type: String,
          default: '',
        },
        display: {
          type: String,
          default: '',
        },
        active: {
          type: Boolean,
          default: true,
        },
        logo: {
          type: String,
          default: '',
        },
      },
    ],
  },
  {
    // this block will use when do we need to specify collection name. collection name should be case sensitive
    //otherwise model plural name consider as collection name
    collection: 'options',
  }
);
module.exports = mongoose.model('Option', optionSchema);
