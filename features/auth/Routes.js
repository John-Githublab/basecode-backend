var express = require("express");
var router = express.Router();

const UserController = require("./controller/UserController");

router.use(function (req, res, next) {
  // middleware specifc for user route
  next();
});

/* GET users related listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// user authentication apis

router.route("/islogin").get(UserController.accountLoginStatus);
router.route("/email/login").post(UserController.emailLogin);
router.route("/mobileno/login").post(UserController.mobileNoLogin);
router.route("/verify/otp").post(UserController.verifyOtp);
router.route("/resend/otp").post(UserController.resendOtp);

router.route("/create").post(UserController.create);
router.route("/update").post(UserController.update);
router.route("/delete").post(UserController.delete);
router.route("/logout").get(UserController.accountLogout);
router.route("/forgot/password").get(UserController.forgotPasswordEmail);
router;
router.route("/userdetail").get(UserController.getUserByMobile);
router.route("/checkuserpresent").get(UserController.checkUserPresent);
router
  .route("/checkuserpresentverifyotp")
  .get(UserController.checkUserPresentVerifyOtp);

router.route("/password/generate").get(UserController.generatePassword);
router.route("/reset/password").put(UserController.resetPassword);
router.route("/profile").get(UserController.profileInfo);
router.route("/profile/update").put(UserController.updateProfile);
router.route("/reset/passwordAttempt").put(UserController.resetPasswordAttempt);
router.route("/search").get(UserController.searchUser);
router.route("/profile/info").get(UserController.getUserProfile);

module.exports = router;
