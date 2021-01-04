let mongoose = require('mongoose');

let cartSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  itemCount: {
    type: Number
  },
  updatedAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000),
  },
}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'carts'
});
module.exports = mongoose.model('AddToCart', cartSchema);
