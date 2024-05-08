module.exports = {
  returnCode: {
    validEmail: 101, //User email id is success, this account valid check
    accountSuspended: 102, //User account is suspended/ deactivated, Need to activate
    emailNotFound: 103, //User email id not found / wrong email id
    passwordMismatch: 104, //Password is mismatch
    passwordMatched: 105, //Password matched
    passwordLimitExceeded: 107, //Exceeded password, (Wrong password more than limited number)
    userException: 106, //Exception in user account checking
    invalidSession: 108, //Session is not valid,not authenticated, relogin to generate new session and associate
    validSession: 109, //sucess, Valid session, data found, result found etc...
    notSubscribed: 110, //User not subscribed to any plan or subscription is expired,
    havePermission: 111, //User  have permission or not yet reached user limit
    noPermission: 112, //User don't have permission or reached user limit
    noDuplicate: 113, //no Duplicate content, can use it
    duplicate: 114, //Duplicate content, it can title or unique field in collection.
    notVerifiedEmail: 115,
    exceededpasswordAttempt: 116,
    moreSubscription: 117,
    invalidToken: 118,
    newPasswordGenerated: 119,
    mismatchPayment: 120, // calculated and received payment is mismatch
    noPolicyAccess: 121,
    "2FactorEnabled": 122,
    recordNotFound: 123,
    available: 124,
    notAvailable: 125,
    success: 100, //	Success
    error: 600, //	Exception / server errror
  },
};
