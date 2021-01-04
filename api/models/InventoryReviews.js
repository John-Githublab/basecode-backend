let mongoose = require('mongoose');

let inventoryReviewSchema = mongoose.Schema({
  userId: { // person who has done comment on this productId
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  productId: { // this is inventoryId, mongo id from inventory collection
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
  },
  active: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
  },
  comment: {
    message: String,
    updatedAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000)
    },
    reply: [{
      message: String,
      repliedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      updatedAt: {
        type: Number,
        default: () => Math.floor(Date.now() / 1000)
      },
    }],
    likes: [{
      type: mongoose.Schema.Types.ObjectId, // shore the liked user details, we use this show all users list
      ref: 'User'
    }],
  },
  updatedAt: {
    type: Number,
    default: Math.floor(Date.now() / 1000)
  }
}, {
  // this block will use when do we need to specify collection name. collection name should be case sensitive
  //otherwise model plural name consider as collection name
  collection: 'inventoryreviews'
});
module.exports = mongoose.model('InventoryReviews', inventoryReviewSchema);
