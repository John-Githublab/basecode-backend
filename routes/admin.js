var express = require("express");
var router = express.Router();

const UserController = require("../api/controller/admin/UserController");
const RoleController = require("../api/controller/admin/RoleController");
const DashboardController = require("../api/controller/admin/DashboardController");
const CorporateController = require("../api/controller/admin/CorporateController");
// const UserController = require("../api/controller/admin/UserController");
var cron = require("node-cron");
const BackupController = require("../api/controller/services/BackupController");
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
router.route("/user/userprofile").post(UserController.getProfileByMobile);
router.route("/reset/password").put(UserController.resetPassword);
router.route("/search/user").get(UserController.searchUser);
router.route("/search").get(UserController.searchAdmin);
router.route("/user/forgot/password").get(UserController.forgotPasswordEmail);
router
  .route("/user/password/generate/:token")
  .put(UserController.generatePassword);

router.route("/verifyotp").post(UserController.verifyOtpNewAdmin);

router.route("/user/resend/otp").post(UserController.resendOtp);

// Dashboard related api's


router
  .route("/get/all/organization")
  .post(CorporateController.getAllOrganization);
router
  .route("/create/organization")
  .post(CorporateController.createOrganization);
router
  .route("/update/organization")
  .put(CorporateController.updateOrganization);
router
  .route("/delete/organization/:organizationId")
  .delete(CorporateController.deleteOrganization);
router
  .route("/get/all/organization/titles")
  .get(CorporateController.queryTitle);
router
  .route("/get/all/parentorganizations/titles")
  .get(CorporateController.getParentOrganizationsTitle);
router
  .route("/organization/details")
  .post(CorporateController.getOrganizationById);
router
  .route("/organization/delete")
  .delete(CorporateController.deleteOrganization);

module.exports = router;
