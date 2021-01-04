var request = require('request');
const connection = require('./../../../config/connection');

module.exports = {
  // sendSMS: async (smsData) => { // this is for the Regular sms, for transaction and for others
  //   try {
  //     console.log("sendSMS");
  //     console.log(smsData.message);
  //     var options = {
  //       url: connection.sms.smsAccountAPIUri,
  //       method: 'POST',
  //       headers: {
  //         'User-Agent': 'Super Agent/0.0.1',
  //         'Authorization': connection.sms.smsAccountApiToken,
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify(
  //         {"to":smsData.mobileNo,
  //         "message":smsData.message,
  //         "sender":connection.sms.smsAccountSenderId}
  //         ),
  //       //body: 'username=mallikarjuna023@gmail.com&hash=c1451c820e8ff29652663eedb13a49d15dc3e58e&message=' + message + '&sender=WINKIN&numbers=' + number
  //     }
  //     // Start the request
  //     request(options, function(error, response, body) {
  //       console.log(body);
  //       if (!error && response.statusCode == 200) {}
  //     });
  //   } catch (err) {
  //     console.error(err);
  //   }
  // },
  sendOtpSMS: async (smsData) => {
    try {
      var options = {
        url:
          connection.sms[0].otpAccountAPIUri +
          'msg=' +
          smsData.message +
          '&v=1.1&userid=' +
          connection.sms[0].otpAccountUserId +
          '&password=' +
          connection.sms[0].otpAaccountPassword +
          '&send_to=' +
          smsData.number +
          '&msg_type=text&method=sendMessage',
        method: 'GET',
        headers: {
          'User-Agent': 'Super Agent/0.0.1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        //body: 'username=mallikarjuna023@gmail.com&hash=c1451c820e8ff29652663eedb13a49d15dc3e58e&message=' + message + '&sender=WINKIN&numbers=' + number
      };
      // Start the request
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
  sendSMS: async (smsData) => {
    // this is for the Regular sms, for transaction and for others
    try {
      var options = {
        url:
          connection.sms[1].transAccountAPIUri +
          'msg=' +
          smsData.message +
          '&v=1.1&userid=' +
          connection.sms[1].transAccountUserId +
          '&password=' +
          connection.sms[1].transAaccountPassword +
          '&send_to=' +
          smsData.number +
          '&msg_type=text&method=sendMessage',
        method: 'GET',
        headers: {
          'User-Agent': 'Super Agent/0.0.1',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        //body: 'username=mallikarjuna023@gmail.com&hash=c1451c820e8ff29652663eedb13a49d15dc3e58e&message=' + message + '&sender=WINKIN&numbers=' + number
      };
      // Start the request
      request(options, function (error, response, body) {
        if (!error && response.statusCode == 200) {
        }
      });
    } catch (err) {
      console.error(err);
    }
  },
  sendCustomerSMS: async (smsData) => {
    // these are customer or client specific sms. this can be customizable
    try {
      //let areaResult=await Area.findById(smsData.areaId).select('smsGateway');
      let gateway = connection;
      let options = {};
      if (!(typeof gateway === 'undefined' || gateway === null)) {
        switch (gateway.smsGateway.provider) {
          case 'gupshup':
            options = {
              url:
                gateway.smsGateway.aPIUrl +
                'msg=' +
                smsData.message +
                '&v=1.1&userid=' +
                gateway.smsGateway.userName +
                '&password=' +
                gateway.smsGateway.password +
                '&send_to=' +
                smsData.mobileNo +
                '&msg_type=text&method=sendMessage',
              method: 'GET',
              headers: {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            };
            break;
          case 'smspoh':
            options = {
              url: gateway.smsGateway.aPIUrl,
              method: 'POST',
              headers: {
                'User-Agent': 'Super Agent/0.0.1',
                Authorization: gateway.smsGateway.authorization,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                to: smsData.mobileNo,
                message: smsData.message,
                sender: gateway.smsGateway.senderId,
              }),
            };
            break;
          default:
            options = {
              url:
                connection.sms.transAccountAPIUri +
                'msg=' +
                smsData.message +
                '&v=1.1&userid=' +
                connection.sms.transAccountUserId +
                '&password=' +
                connection.sms.transAaccountPassword +
                '&send_to=' +
                smsData.mobileNo +
                '&msg_type=text&method=sendMessage',
              method: 'GET',
              headers: {
                'User-Agent': 'Super Agent/0.0.1',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
            };
        }
        console.log('send sms');
        console.log(options);
        request(options, function (error, response, body) {
          if (!error && response.statusCode == 200) {
            console.log(body);
          }
        });
      }
    } catch (err) {
      console.error(err);
    }
  },
};
