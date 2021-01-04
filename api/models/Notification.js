let mongoose = require('mongoose');

let notificationSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // this is userId, one who received  notification
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // this senderId will empty or null for System generate notification and else it will be admin user id who triggered notification
    },
    visibleOn: Array,
    title: String,
    body: String,
    icon: String,
    poster: String,
    actionUrl: String,
    category: {
      type: String,
      default: 'cases', // this is for particular page, like cases, labresult etc
    },
    notifyMethod: String, //currently not using
    actionType: String, //where it has to open
    actionId: String, // app end case mongo id
    read: {
      type: Boolean,
      default: false,
    },
    visibleOnHome: {
      type: Boolean,
      default: false,
    },
    updatedAt: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
      // default: Math.floor(new Date().getTime() / 1000)
    },
  },
  {
    // this block will use when do we need to specify collection name. collection name should be case sensitive
    //otherwise model plural name consider as collection name
    //collection: 'users'
  }
);
module.exports = mongoose.model('Notification', notificationSchema);
