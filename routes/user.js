var express = require('express');
var router = express.Router();

const UserController = require('../api/controller/user/UserController');

router.use(function (req, res, next) {
  //console.log('users route');
  next();
});

/* GET users related listing. */
router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});

// general apis
router.route('/upload/file').put(UserController.uploadFiles);

router.route('/islogin').get(UserController.accountLoginStatus);
router.route('/accountLogin').post(UserController.accountLogin);
router.route('/mobileno/login').post(UserController.mobileNoLogin);
router.route('/verify/otp').post(UserController.verifyOtp);
router.route('/resend/otp').post(UserController.resendOtp);

router.route('/create').post(UserController.create);
router.route('/update').post(UserController.update);
router.route('/delete').post(UserController.delete);
router.route('/logout').get(UserController.accountLogout);
router.route('/unsubscribe/:email').get(UserController.unsubscribeEmail);
router.route('/forgot/password').get(UserController.forgotPasswordEmail);
router;
router.route('/userdetail').get(UserController.getUserByMobile);
router.route('/checkuserpresent').get(UserController.checkUserPresent);
router
  .route('/checkuserpresentverifyotp')
  .get(UserController.checkUserPresentVerifyOtp);

router.route('/password/generate').get(UserController.generatePassword);
router.route('/reset/password').put(UserController.resetPassword);
router.route('/profile').get(UserController.profileInfo);
router.route('/profile/update').put(UserController.updateProfile);
router.route('/reset/passwordAttempt').put(UserController.resetPasswordAttempt);
router.route('/dropdown/options').get(UserController.getAllDropdownList);
// adding caregiver and patient, get the list of users list
router.route('/search').get(UserController.searchUser);
router.route('/profile/info').get(UserController.getUserProfile);

router.route('/testOrigin').post((req, res, next) => {
  console.log('Test');
  var origin = req.get('origin');
  console.log('origin');
  console.log(origin);
  res.status(200).send({ message: 'success' });
}); //var origin = req.get('origin');
module.exports = router;
