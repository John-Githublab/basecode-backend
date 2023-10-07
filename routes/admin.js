var express = require("express");
var router = express.Router();

const UserController = require("../api/controller/admin/UserController");
const RoleController = require("../api/controller/admin/RoleController");
const DashboardController = require("../api/controller/admin/DashboardController");
// const UserController = require("../api/controller/admin/UserController");
var cron = require("node-cron");
const BackupController = require("../api/controller/services/BackupController");
const UtilController = require("../api/controller/services/UtilController");
router.use(function (req, res, next) {
  //  console.log('Something is happening. in admin route');
  next();
});
// run mongodb backup cron job
let dbBackupTask = cron.schedule("59 23 * * *", () => {
  //'59 23 * * *
  console.log("mongodb backup scheduler is triggered");
  BackupController.mongodbBackup();
});

// Dashboard related apis

// general apis
router.route("/list/all/upload/file").put(UserController.listUploadedFiles);
router.route("/fileDownloader").get(UserController.fileDownloader);

router.route("/islogin").get(UserController.accountLoginStatus);
router.route("/accountLogin").post(UserController.accountLogin);
router.route("/verify/otp").post(UserController.verifyOtp);
router.route("/resend/otp").post(UserController.resendOtp);
router.route("/logout").get(UserController.accountLogout);
router.route("/password/generate").get(UserController.generatePassword);
router.route("/forgot/password").get(UserController.forgotPasswordEmail);

// Role creation and granting permission to employee
router.route("/roles/all").post(RoleController.queryRole);
router.route("/roles/titles").get(RoleController.queryTitle);
router.route("/role/details").post(RoleController.getRoleInfoById); // this is to get complete details particular role.
router.route("/role/create").post(RoleController.createRole);
router
  .route("/role/permission/update")
  .put(RoleController.updateRolePermission);
router.route("/role/permission/grant").put(RoleController.grantRole);
router.route("/role/permission/unassigned").post(RoleController.getUnassigned);

// User related apis
router.route("/user/all").post(UserController.queryAllUser);
router
  .route("/user/resetpasswordattempt")
  .post(UserController.resetPasswordAttempt);
router.route("/user/add").post(UserController.createUser);
router.route("/user/details").post(UserController.getUserById);
router.route("/user/update").put(UserController.updateUser);
router.route("/user/delete").delete(UserController.deleteUser);
router.route("/user/userdetail").get(UserController.getAdminByMobile);
router.route("/reset/password").put(UserController.resetPassword);
router.route("/user/forgot/password").get(UserController.forgotPasswordEmail);
router
  .route("/user/password/generate/:token")
  .put(UserController.generatePassword);

router.route("/verifyotp").post(UserController.verifyOtpNewAdmin);

router.route("/user/resend/otp").post(UserController.resendOtp);

// googleApis
router.route("/location/search").get(UtilController.getLocation); //lat and lng for users
router.route("/location/coordinates").get(UtilController.getCoordinates);

module.exports = router;
