module.exports = {
  admin: {
    authNotRequire: [
      '/admin',
      '/inventory/test',
      '/user/userdetail',
      '/verifyotp',
      // "/search/patientCaregiver"
    ], // admin mush validate authorization require for this end points then only they can process
    language: [],
  },
  user: {
    authNotRequire: [
      "/home",
      "/accountLogin",
      "/mobileno/login",
      "/verify/otp",
      "/resend/otp",
      "/create",
      "/forgot/password",
      "/password/generate",
      "/verifyotp",
      "/userdetail",
      "/chat",
      "/chat/1",
      "/chat/message",
      "/checkuserpresent",
      "/checkuserpresentverifyotp"
    ],
    language: [],
  },
  index: {
    authNotRequire: ['/', '/config/aws'],
    language: [],
  },
};