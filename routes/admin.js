var express = require('express');
var router = express.Router();

const UserController = require('../api/controller/admin/UserController');
const RoleController = require('../api/controller/admin/RoleController');
const AdvertisementController = require('../api/controller/admin/AdvertisementController');
const InventoryController = require('../api/controller/admin/InventoryController');
const DashboardController = require('../api/controller/admin/DashboardController');
const NotificationController = require('../api/controller/admin/NotificationController');
// const UserController = require("../api/controller/admin/UserController");
var cron = require('node-cron');
const BackupController = require('../api/controller/services/BackupController');
router.use(function (req, res, next) {
  //  console.log('Something is happening. in admin route');
  next();
});
// run mongodb backup cron job
let dbBackupTask = cron.schedule('59 23 * * *', () => {
  //'59 23 * * *
  console.log('mongodb backup scheduler is triggered');
  BackupController.mongodbBackup();
});

// Dashboard related apis

// general apis
router.route('/list/all/upload/file').put(UserController.listUploadedFiles);
router.route('/fileDownloader').get(UserController.fileDownloader);

// Role creation and granting permission to employee
router.route('/roles/all').post(RoleController.queryRole);
router.route('/roles/titles').get(RoleController.queryTitle);
router.route('/role/details').post(RoleController.getRoleInfoById); // this is to get complete details particular role.
router.route('/role/create').post(RoleController.createRole);
router
  .route('/role/permission/update')
  .put(RoleController.updateRolePermission);
router.route('/role/permission/grant').put(RoleController.grantRole);
router.route('/role/permission/unassigned').post(RoleController.getUnassigned);

router
  .route('/advertisement/all')
  .post(AdvertisementController.queryAdvertisement);
router
  .route('/advertisement/details')
  .post(AdvertisementController.getAdvertisementInfoById);

router
  .route('/advertisement/create')
  .post(AdvertisementController.createAdvertisement);

router
  .route('/advertisement/update')
  .put(AdvertisementController.updateAdvertisement);
router
  .route('/Advertisement/delete')
  .delete(AdvertisementController.deleteAdvertisement);
router.route('/Advertisement/search').get(AdvertisementController.getSearch);
router
  .route('/Advertisement/orderitem')
  .post(AdvertisementController.getOrderFromInventory);

router
  .route('/notification/details')
  .post(NotificationController.getUserBasedNotifications);
router
  .route('/notification/case/details')
  .post(NotificationController.getCaseBasedNotifications);
router
  .route('/notification/casetemplates')
  .get(NotificationController.getNotificationTemplate);
router
  .route('/case/notification/create')
  .post(NotificationController.createNotifications);
router
  .route('/user/notification/create')
  .post(NotificationController.createUserNotifications);
router
  .route('/notification/update/status')
  .post(NotificationController.retireNotifiation);

// Inventory related apis
router.route('/inventory/test').get(InventoryController.excelOperationCheck); // this is for the testing
router.route('/inventory/all').post(InventoryController.queryInventory);
router.route('/inventory/upload/items').post(InventoryController.uploadItems); // this is to add/edit new items to inventory
router.route('/inventory/upload/stock').post(InventoryController.uploadStock); // this is to upload only stock count of inventory item.
router.route('/inventory/upload/price').post(InventoryController.uploadPrice);
router.route('/inventory/availablecount').post(InventoryController.getOptions);
router.route('/inventory/search').post(InventoryController.searchInventory);
router
  .route('/inventory/upload/image')
  .put(InventoryController.uploadInventoryImages);
router
  .route('/inventory/add')
  .post(InventoryController.createInventoryFromMedication);

// User related apis
router.route('/user/all').post(UserController.queryAllUser);
router
  .route('/user/resetpasswordattempt')
  .post(UserController.resetPasswordAttempt);
router.route('/user/add').post(UserController.createUser);
router.route('/user/details').post(UserController.getUserById);
router.route('/user/update').put(UserController.updateUser);
router.route('/user/delete').delete(UserController.deleteUser);
router.route('/user/userdetail').get(UserController.getAdminByMobile);
router.route('/user/userprofile').post(UserController.getProfileByMobile);
router.route('/reset/password').put(UserController.resetPassword);
router.route('/search/user').get(UserController.searchUser);
router.route('/search').get(UserController.searchAdmin);
router.route('/user/forgot/password').get(UserController.forgotPasswordEmail);
router
  .route('/user/password/generate/:token')
  .put(UserController.generatePassword);

router.route('/verifyotp').post(UserController.verifyOtpNewAdmin);

router.route('/user/resend/otp').post(UserController.resendOtp);

// Dashboard related api's
router
  .route('/dashboard/order/stats/status')
  .post(DashboardController.getOrderStatusCount);
router
  .route('/dashboard/order/stats/types')
  .post(DashboardController.getOrderTypesCount);
router
  .route('/dashboard/order/stats/paymentmode')
  .post(DashboardController.getOrderModeCount);

router
  .route('/dashboard/order/stats/cardvalues')
  .get(DashboardController.getCardValues);

router
  .route('/dashboard/order/stats/newcustomer')
  .post(DashboardController.getNewCustomerCount);

router.route('/dashboard/webstats').get(DashboardController.getWebAppStats);
router.route('/dashboard/casestats').post(DashboardController.getCaseStats);

module.exports = router;
