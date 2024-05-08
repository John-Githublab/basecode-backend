// this is controller is created to handle all user notification related request,
// this controller will decide what ara all methods used to send notification like email, sms etc
var request = require("request");
let mongoose = require("mongoose");
const connection = require("../../../config/connection");
const EmailController = require("./EmailController");
const SmsController = require("./SmsController");
const UserSocketController = require("./UserSocketController");
const User = require("../../../features/auth/model/User");
const Notification = require("../../models/Notification");
const NotificationTemplate = require("../../models/NotificationTemplate");
const UtilController = require("./UtilController");
const FcmController = require("./FcmController");

let hostName = connection.hostName;
module.exports = {
  replaceDynamicVariable: async (notificationData, notification) => {
    let data = notificationData;

    try {
      for (keys in notification.data) {
        let tempRep = new RegExp("<%" + keys + "%>", "g");

        data = data.replace(tempRep, notification.data[keys]);
      }
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  replaceTemplateDynamicVariable: async (notification) => {
    let data = "";
    let templateSubject = "";
    try {
      let template = await NotificationTemplate.findOne({
        title: notification.title,
        active: true,
        publish: true,
        //  areaId: mongoose.Types.ObjectId(notification.areaId),
        notificationType: notification.notificationType,
      });

      if (!UtilController.isEmpty(template)) {
        data = template.content;
        if (notification.notificationType === "email") {
          // Create a buffer from the string
          let bufferObj = Buffer.from(template.content, "base64");
          // Encode the Buffer as a utf8 string
          let decodedContent = bufferObj.toString("utf8");
          data = decodedContent;
          templateSubject = template.subject;
        }
        let keys,
          values = "";
        let tempRep;
        for (let i = 0; i < template.dynamicVariable.length; i++) {
          keys = template.dynamicVariable[i].label;
          tempRep = new RegExp("<%" + keys + "%>", "g");

          values = notification.data[keys];

          if (
            values !== undefined &&
            values.length > template.dynamicVariable[i].contentLength
          ) {
            values = values.substr(
              0,
              template.dynamicVariable[i].contentLength
            );
          }

          data = data.replace(tempRep, values);
          templateSubject = templateSubject.replace(tempRep, values); // this is for the email subject, if it contain dynamicVariable then needs to replace
        }
      }
    } catch (err) {
      console.error(err);
    }
    let returnData = {
      content: data,
      subject: templateSubject,
    };
    return returnData;
  },
  userMobileNoOtp: async (notification) => {
    try {
      notification["title"] = "loginOTP";
      notification["notificationType"] = "sms";
      let notifyTemplate = {};
      notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
        notification
      );
      SmsController.sendCustomerSMS({
        mobileNo: notification.mobileNo,
        message: notifyTemplate.content,
        //areaId:notification.areaId
      });
    } catch (err) {
      console.error(err);
    }
  },

  sendUserOtp: async (notification) => {
    try {
      notification["title"] = "loginOTP";
      notification["notificationType"] = "sms";
      let notifyTemplate = {};
      notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
        notification
      );
      SmsController.sendCustomerSMS({
        mobileNo: notification.mobileNo,
        message: notifyTemplate.content,
        //  areaId:notification.areaId
      });
      notification["notificationType"] = "email";
      notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
        notification
      );

      notifyTemplate["toAddresses"] = notification.email;

      EmailController.sendCustomMail(notifyTemplate);
    } catch (err) {
      console.error(err);
    }
  },

  sendUserNotification: async (notification) => {
    try {
      let notifyTemplate = {};
      if (UtilController.isEmpty(notification.templateId)) {
        notifyTemplate.content = await module.exports.replaceDynamicVariable(
          Buffer.from(notification.body, "base64").toString("utf8"),
          notification
        );
        notifyTemplate.subject = notification.title;
      } else {
        notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
          notification
        );
      }
      notification["body"] = notifyTemplate.content;

      if (notification.actionTo === "caregiver") {
        let userCaregiverResult = await User.findById(
          notification.data._id
        ).populate("caregiver", "mobileNo email fcmToken");
        for (let k = 0; k < userCaregiverResult.caregiver.length; k++) {
          notification.mobileNo = userCaregiverResult.caregiver[k].mobileNo;
          notification.fcmId = userCaregiverResult.caregiver[k].fcmToken;
          notification.email = userCaregiverResult.caregiver[k].email;
          notification.userId = userCaregiverResult.caregiver[k]._id;
        }
      }

      // module.exports.addToNotification(notification);

      for (let i = 0; i < notification.visibleOn.length; i++) {
        switch (notification.visibleOn[i]) {
          case "sms":
            if (!UtilController.isEmpty(notification.mobileNo)) {
              SmsController.sendCustomerSMS({
                mobileNo: notification.mobileNo,
                message: notifyTemplate.content,
              });
            }
            break;
          case "email":
            if (!UtilController.isEmpty(notification.email)) {
              notifyTemplate["toAddresses"] = notification.email;
              EmailController.sendCustomMail(notifyTemplate);
            }
            break;
          case "app":
            if (!UtilController.isEmpty(notification.fcmId)) {
              FcmController.sendFcmNotification(
                notification.fcmId,
                notification
              );
            }
            break;

          case "whatsApp":
            //Implementation is later version
            break;

          default:
            break;
        }
      }

      if (notification.actionTo === "both") {
        let userResult = await User.findById(notification.data._id).populate(
          "caregiver",
          "mobileNo email fcmToken"
        );

        for (let t = 0; t < userResult.caregiver.length; t++) {
          notification.templateId = notification.templateId;
          notification.actionTo = "";

          if (UtilController.isEmpty(notification.templateId)) {
            notification.body = Buffer.from(notification.body, "utf8").toString(
              "base64"
            );
          }

          notification.mobileNo = userResult.caregiver[t].mobileNo;
          notification.fcmId = userResult.caregiver[t].fcmToken;
          notification.email = userResult.caregiver[t].email;
          notification.userId = userResult.caregiver[t]._id;

          await module.exports.sendUserNotification(notification);
        }
      }
    } catch (err) {
      console.error(err);
    }
  },

  sendDeliveryOtp: async (notification) => {
    try {
      notification["title"] = "deliveryOTP";
      notification["notificationType"] = "sms";
      let notifyTemplate = {};
      notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
        notification
      );
      SmsController.sendCustomerSMS({
        mobileNo: notification.mobileNo,
        message: notifyTemplate.content,
        //  areaId:notification.areaId
      });
      // Later we will integrate the email

      // notification['notificationType']='email';
      //  notifyTemplate =await module.exports.replaceTemplateDynamicVariable(notification)

      // notifyTemplate['toAddresses']=notification.email;

      //   EmailController.sendCustomMail(notifyTemplate);
    } catch (err) {
      console.error(err);
    }
  },
  userRegistration: async function (notification) {
    let emailObj = {
      data: {
        unsubscribe: hostName + "/user/unsubscribe/" + notification.emailId,
      },
      toAddresses: notification.emailId,
      //receiverName: notification.receiverName,
      emailSubject: "Welcome to the world of Policies",
    };
    EmailController.sendUserMail(
      "./templates/email/registration.html",
      emailObj
    );
  },
  emailVerification: async function (notification) {
    let token = Math.random().toString(36).slice(-10);
    let emailObj = {
      data: {
        unsubscribe: hostName + "/user/unsubscribe/" + notification.emailId,
        //confirmation: hostName + "/user/email/confirmation?email=" + notification.emailId + "&category=" + notification.userType + "&token=" + token,
        confirmation:
          hostName +
          "/#/email/confirmation/" +
          notification.emailId +
          "/" +
          notification.userType +
          "/" +
          token,
        toAddresses: notification.emailId,
        receiverName: notification.receiverName,
      },
      toAddresses: notification.emailId,
      receiverName: notification.receiverName,
      emailSubject: "Confirm The Policy Table Account",
    };
    EmailController.sendUserMail(
      "./templates/email/confirmation.html",
      emailObj
    );
  },
  notifyUserRegistration: async function (notification) {
    let emailObj = {
      data: {
        unsubscribe: hostName + "/user/unsubscribe/" + notification.emailId,
        name: notification.name,
        email: notification.email,
        mobileNo: notification.mobileNo,
        organisation: notification.organization,
        industryType: notification.industryType,
        headCount: notification.headCount,
      },
      toAddresses: notification.emailId,
      //receiverName: notification.receiverName,
      emailSubject: notification.name + " is registed on The Policy Table",
    };
    EmailController.sendUserMail(
      "./templates/email/notifyUserRegistrationToPimarq.html",
      emailObj
    );
  },
  forgotPassword: async function (notification) {
    // Old code

    // let emailObj = {
    //   data: {
    //     receiverName: notification.receiverName,
    //     password: notification.password,
    //     unsubscribe: hostName + "/admin/unsubscribe/" + notification.emailId,
    //     toAddresses: notification.emailId,
    //     resetLink: hostName + "/#/password/generate/" + notification.password,
    //     //confirmation: hostName + "/user/emailConfirmation/" + notification.emailId,
    //   },
    //   toAddresses: notification.emailId,
    //   emailSubject: "Reset your Admin password",
    //   //emailSubject: "Password reset for " + notification.emailId + " account in Pimarq"
    // };
    // EmailController.sendUserMail(
    //   "./templates/email/resetPassword.html",
    //   emailObj
    // );
    // Read the email template from database
    notification["data"] = {
      receiverName: notification.receiverName,
      password: notification.password,
      unsubscribe: hostName + "/admin/unsubscribe/" + notification.emailId,
      toAddresses: notification.emailId,
      resetLink:
        hostName + "/#/user/password/generate?token=" + notification.password,
    };
    notification["title"] = "resetPassword";
    notification["notificationType"] = "email";
    notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
      notification
    );

    notifyTemplate["toAddresses"] = notification.emailId;
    EmailController.sendCustomMail(notifyTemplate);
  },
  newRegistration: async function (notification) {
    // Old code

    // let emailObj = {
    //   data: {
    //     receiverName: notification.receiverName,
    //     password: notification.password,
    //     unsubscribe: hostName + "/admin/unsubscribe/" + notification.emailId,
    //     toAddresses: notification.emailId,
    //     resetLink: hostName + "/#/password/generate/" + notification.password,
    //     //confirmation: hostName + "/user/emailConfirmation/" + notification.emailId,
    //   },
    //   toAddresses: notification.emailId,
    //   emailSubject: "Reset your Admin password",
    //   //emailSubject: "Password reset for " + notification.emailId + " account in Pimarq"
    // };
    // EmailController.sendUserMail(
    //   "./templates/email/resetPassword.html",
    //   emailObj
    // );
    // Read the email template from database
    notification["data"] = {
      receiverName: notification.receiverName,
      confirmation:
        hostName + "/#/register/admin?ui=" + notification.confirmation,
      unsubscribe: hostName + "/admin/unsubscribe/" + notification.emailId,
      toAddresses: notification.emailId,
      resetLink: hostName + "/#/registration/admin?ui=" + notification.password,
    };
    notification["title"] = "newRegistration";
    notification["notificationType"] = "email";
    notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
      notification
    );

    notifyTemplate["toAddresses"] = notification.emailId;
    EmailController.sendCustomMail(notifyTemplate);
  },

  generatedPassword: async function (notification) {
    // Old code

    // let emailObj = {
    //   data: {
    //     receiverName: notification.receiverName,
    //     password: notification.password,
    //     unsubscribe: hostName + "/admin/unsubscribe/" + notification.emailId,
    //     toAddresses: notification.emailId,
    //   },
    //   toAddresses: notification.emailId,
    //   emailSubject: "Your new password for Admin account login",
    // };
    // EmailController.sendUserMail(
    //   "./templates/email/generatedPassword.html",
    //   emailObj
    // );

    notification["data"] = {
      receiverName: notification.receiverName,
      password: notification.password,
      unsubscribe: hostName + "/admin/unsubscribe/" + notification.emailId,
      toAddresses: notification.emailId,
    };
    notification["title"] = "newPassword";
    notification["notificationType"] = "email";
    notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
      notification
    );

    notifyTemplate["toAddresses"] = notification.emailId;

    EmailController.sendCustomMail(notifyTemplate);
  },
  userCredentials: async (notification) => {
    try {
      console.log("notification", notification);
      notification["title"] = "userCredentials";
      notification["notificationType"] = "email";
      let notifyTemplate = await module.exports.replaceTemplateDynamicVariable(
        notification
      );
      //notifyTemplate['areaId']=notification.areaId;
      notifyTemplate["toAddresses"] = notification.email;
      EmailController.sendCustomMail(notifyTemplate);
      // let userResult = await User.findById(notification.userId);
      // let emailObj = {
      //   data: {
      //     date: module.exports.getformatedDate(Math.floor(Date.now() / 1000)),
      //     receiverName: userResult.name,
      //     organization: userResult.organisation,
      //     password: notification.password,
      //     userName: notification.userName,
      //     unsubscribe: hostName + "/user/unsubscribe/" + userResult.email,
      //     toAddresses: userResult.email,
      //   },
      //   toAddresses: userResult.email,
      //   emailSubject: "Your login credentials for The Policy Table",
      // };
      // EmailController.sendUserMail(
      //   "./templates/email/userCredentials.html",
      //   emailObj
      // );
    } catch (err) {
      console.error(err);
    }
  },

  addToNotification: async (notification) => {
    try {
      if (!UtilController.isEmpty(notification.updatedAt)) {
        delete notification.updatedAt;
      }

      await Notification.create(notification);
    } catch (err) {
      console.error(err);
    }
  },
  sendFcmMessage: async (fcmId, notification) => {
    try {
      await module.exports.addToNotification(notification);

      FcmController.sendFcmNotification(fcmId, notification);
    } catch (err) {
      console.error(err);
    }
  },
  getformatedDate: function (unix_timestamp) {
    if (unix_timestamp == "" || unix_timestamp == undefined) {
      return "-";
    }
    var a = new Date(unix_timestamp * 1000);
    //var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var months = [
      "01",
      "02",
      "03",
      "04",
      "05",
      "06",
      "07",
      "08",
      "09",
      "10",
      "11",
      "12",
    ];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    //var time = pad(date, 2) + '-' +  pad(month, 2) + '-' + year + ' ' + pad(hour, 2) + ':' + pad(min, 2) + ':' + pad(sec, 2);
    var time =
      module.exports.pad(date, 2) +
      "-" +
      module.exports.pad(month, 2) +
      "-" +
      year;
    return time;
  },
  pad: function (num, size) {
    var s = num + "";
    while (s.length < size) s = "0" + s;
    return s;
  },
};
