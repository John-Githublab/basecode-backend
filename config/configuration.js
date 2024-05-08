module.exports = {
  login: {
    otpValidation: 300, // 5 minutes
    admin: {
      "2FactorAuthentication": true,
    },
    maxBadPasswordAttempt: 3,
  },
};
