let mongoose = require('mongoose');

let subscriptionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  active: {
    type: Boolean,
    default: true
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Plan'
  },
  // plan: { // this is the copy of plan, insted of having planId, we are coping complete plan object, if tomorrow any changes happed in plan should not impact on exsting or purchased users
  //   title: String, // Plan name
  //   description: String,
  //   poster: String,
  //   planType: String, // this can be a free,basic,custom
  //   newModuleLimit: Number, // this is plan based limitation on user, new module creation limit, user can not exceed this value
  //   newPolicyLimit: Number,
  //   newSubPolicyLimit: Number, // new sub-policy creation limit
  //   policyTemplateLimit: Number,
  //   subPolicyTemplateLimit: Number, // this is to limit the number of sub policy creation
  //   employeeLimit: Number, // new employee creation and giving permission is limited and not exceed this value
  //   validity: Number, // number of days valid for
  //   payment: Number,
  //   validation: String, // this is for future use, if they want limited and unlimited offers
  //   userId: {
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User'
  //   }, // we can define modules for each plan subscribe, there modules will add defaultly, later can change if they need
  //   modules: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Module'
  //   }],
  //   templates: [{
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'Template'
  //   }],
  //   subTemplate: [{ // second level of policy, it is the child of policy and having permission to access
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'SubTemplate'
  //   }]
  // },
  startAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }, // plan validation, take current system time when they purchased, and calculate endAt by adding no of days(validation)
  endAt: Number,
  addedBy: { // this is to track the purchase, who has done this. some time admin can add new policy to user account backend and collect cash
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  },
  createdAt: {
    type: Number,
    default: () => Math.floor(Date.now() / 1000)
  }
});
module.exports = mongoose.model('Subscription', subscriptionSchema);
