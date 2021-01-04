let mongoose = require('mongoose');

let userSchema = mongoose.Schema(
  {
    fname: {
      type: String,
      default: '',
    },
    lname: {
      type: String,
      default: '',
    },
    // userTag: {
    //   type: String,
    //   default: '',
    // }, // this is unique key which defines user details.and use for login
    email: {
      type: String,
      default: '',
    }, // use email as unique user access
    userName: {
      type: String,
      default: '',
    }, //his is unique key and use for login
    password: {
      type: String,
      default: '',
    },
    fcmToken: {
      type: String,
      default: '',
    },
    subscribe: {
      //Communication preferences (Newsletter etc.), if this parameter is enabled, then only we can send notification
      type: Boolean,
      default: true,
    }, // this is to sent email to subscribe user
    emailVerified: {
      type: Boolean,
      default: true,
    },
    plan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    subscription: {
      // this is to keep active subscription details here, easy to query
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subscription',
    },
    mobileNo: {
      type: String,
      default: '',
    },
    emergencyNo: {
      type: Array,
      default: [],
    }, // this is for emergency contact
    preferredLanguage: {
      type: Array,
      default: [],
    },
    //Notification Settings (SMS, Email, Whatsapp) to send notification to users
    notification: {
      sms: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: true,
      },
      whatsapp: {
        type: Boolean,
        default: true,
      },
      notice: {
        // advertizement notice, which will populate automatically when user open app
        type: Boolean,
        default: true,
      },
      inapp: {
        type: Boolean,
        default: true,
      },
    },
    active: {
      type: Boolean,
      default: false, // pimarq admin will change to active after verification
    },
    userType: {
      type: String,
      default: 'user', // this can be user/clinic(clinic or hospital)/admin(admin mean administration guys)
    }, // this is to recognize user is pimarq or user(organization), to control the permission
    designation: String, // this will cook,manager, security
    status: {
      // to keep track, lke pending,approved,rejected
      type: String,
      default: 'pending',
    }, //adding from admin approved
    profileImage: {
      type: String,
      default: '',
    },
    socketId: {
      type: String,
      default: '',
    },

    gender: {
      type: String,
      default: '',
    },

    dob: {
      type: Number,
      default: 0,
    },
    tagLine: {
      type: String,
      default: '',
    },
    age: {
      type: Number,
      default: 0,
    },
    patientId: {
      type: String, // this is the system generated unique key, this will come from tag collection
      default: '',
    },

    // deliveryAddress: {
    //   type: Array,
    //   default: [],
    // }, // this will be populate to take user current address.
    currentSessionId: {
      type: String,
      default: '',
    },
    permission: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Role',
    },
    clinic: [
      {
        // this will be list of clinic id's for admins or to get multi branch information. for doctor it will one
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Clinic',
      },
    ],
    isSuperAdmin: {
      type: Boolean,
      default: false,
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
    additionalInfo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInfo',
    },
    passwordAttempt: {
      type: Number, // this is avoid mulfuction of login. if wrong password is exceed this value then don't allow then to login
      default: 0,
    },
    passwordReset: {
      type: Boolean,
      default: false,
    },
    // these are the list of services which are selected during plan or policy purchase

    lastLogin: {
      type: Number,
      default: () => Math.floor(Date.now() / 1000),
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
    collection: 'users',
  }
);
module.exports = mongoose.model('User', userSchema);
