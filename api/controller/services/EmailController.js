let request = require("request");
var fs = require("fs");
var path = require("path");
let mongoose = require("mongoose");
const connection = require("../../../config/connection");
const AWS = require("aws-sdk");

const nodemailer = require("nodemailer"); // sending email from smtp connection

AWS.config.update({
  secretAccessKey: connection.aws.secretAccessKey,
  accessKeyId: connection.aws.accessKeyId,
  region: "ap-south-1",
});
module.exports = {
  sendEmail: async function (data) {
    console.log("Email req");
    // Create sendEmail params
    var params = {
      Destination: {
        /* required */
        CcAddresses: [
          "mallikarjuna@geeksynergy.com",
          /* more items */
        ],
        ToAddresses: [
          "mallikarjuna023@gmail.com",
          /* more items */
        ],
      },
      Message: {
        /* required */
        Body: {
          /* required */
          Html: {
            Charset: "UTF-8",
            Data: data,
          },
          // Text: {
          //   Charset: "UTF-8",
          //   Data: "The easiest way to play videos in HTML, is to use YouTube."
          // }
        },
        Subject: {
          Charset: "UTF-8",
          Data: "AWS Test emai",
        },
      },
      Source: "Hoblist<notification@hoblist.com>",
      /* required */
      ReplyToAddresses: [
        "notification@hoblist.com",
        /* more items */
      ],
    };

    // Create the promise and SES service object
    var sendPromise = new AWS.SES({
      apiVersion: "2010-12-01",
    })
      .sendEmail(params)
      .promise();

    // Handle promise's fulfilled/rejected states
    sendPromise
      .then(function (data) {
        console.log("email send response: ");
        console.log(data);
        res.send(JSON.stringify(data));
      })
      .catch(function (err) {
        console.error(err, err.stack);
      });
  },
  sendUserMail: async function (template, emailData) {
    try {
      fs.readFile(template, "utf8", function (err, data) {
        if (err) {
          console.error(err);
          console.log(err);
        } else {
          for (keys in emailData.data) {
            let tempRep = new RegExp("<%" + keys + "%>", "g");
            data = data.replace(tempRep, emailData.data[keys]);
          }
          var params = {
            Destination: {
              ToAddresses: [emailData.toAddresses],
            },
            Message: {
              Body: {
                Html: {
                  Charset: "UTF-8",
                  Data: data,
                },
              },
              Subject: {
                Charset: "UTF-8",
                Data: emailData.emailSubject,
              },
            },
            //Source: 'Hoblist<notification@hoblist.com>',
            Source: "Pimarq<noreply@pimarq.com>",
            ReplyToAddresses: [
              "enquiry@pimarq.com",
              //'notification@hoblist.com',
            ],
          };

          var sendPromise = new AWS.SES({
            apiVersion: "2010-12-01",
          })
            .sendEmail(params)
            .promise();
          sendPromise
            .then(function (data) {
              console.log("email send response: " + emailData.toAddresses);
            })
            .catch(function (err) {
              console.error(err, err.stack);
            });
        }
      });
    } catch (err) {
      console.log(err);
    }
  },
  sendUserCustomMail: async function (data, emailData) {
    try {
      for (keys in emailData.data) {
        let tempRep = new RegExp("<%" + keys + "%>", "g");
        data = data.replace(tempRep, emailData.data[keys]);
      }
      var params = {
        Destination: {
          ToAddresses: [emailData.toAddresses],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: data,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: emailData.emailSubject,
          },
        },
        Source: "Pimarq<noreply@pimarq.com>",
        ReplyToAddresses: ["enquiry@pimarq.com"],
      };

      var sendPromise = new AWS.SES({
        apiVersion: "2010-12-01",
      })
        .sendEmail(params)
        .promise();
      sendPromise
        .then(function (data) {
          console.log("email send response: " + emailData.toAddresses);
        })
        .catch(function (err) {
          console.error(err, err.stack);
        });
    } catch (err) {
      console.log(err);
    }
  },
  // this is dyanamic and getting credentials from areas specific. can be configure for any smtp email server
  sendCustomMail: async function (emailData) {
    try {
      // let areaResult = await Area.findById(emailData.areaId).select('emailGateway');
      let gateway = connection;
      if (!(typeof gateway === "undefined" || gateway === null)) {
        switch (gateway.emailGateway.provider) {
          case "aws":
            module.exports.sendEmailByAWS(gateway.emailGateway, emailData);
            break;
          case "smtp":
            module.exports.sendEmailBySMTP(gateway.emailGateway, emailData);
            break;
          case "sendgrid":
            module.exports.sendEmailBySendGrid(gateway.emailGateway, emailData);
            break;
          default:
        }
        // test nodemailer, end here
      }
    } catch (err) {
      console.log(err);
    }
  },
  sendEmailBySMTP: async (credentials, emailData) => {
    try {
      // test nodemailer, start here
      let transporter = nodemailer.createTransport({
        host: credentials.server,
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: credentials.userName, // smtp userName
          pass: credentials.password, // smtp user password
        },
      });
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: credentials.senderEmail, // sender address
        replyTo: credentials.replyToEmail,
        to: emailData.toAddresses, // list of receivers
        subject: emailData.subject, // Subject line
        html: emailData.content, // html body
      });
      console.log(
        "smtp email message sent to : %s " + emailData.toAddresses,
        info.messageId
      );
    } catch (err) {
      console.error(err);
    }
  },
  sendEmailByAWS: async (credentials, emailData) => {
    try {
      AWS.config.update({
        secretAccessKey: credentials.password,
        accessKeyId: credentials.userName,
        region: credentials.region,
      });
      var params = {
        Destination: {
          ToAddresses: [emailData.toAddresses],
        },
        Message: {
          Body: {
            Html: {
              Charset: "UTF-8",
              Data: emailData.content,
            },
          },
          Subject: {
            Charset: "UTF-8",
            Data: emailData.subject,
          },
        },
        Source: credentials.senderEmail,
        ReplyToAddresses: [credentials.replyToEmail],
      };
      var sendPromise = new AWS.SES({
        apiVersion: "2010-12-01",
      })
        .sendEmail(params)
        .promise();
      sendPromise
        .then(function (data) {
          console.log("email send response: " + emailData.toAddresses);
        })
        .catch(function (err) {
          console.error(err, err.stack);
        });
    } catch (err) {
      console.error(err);
    }
  },
  sendEmailBySendGrid: async (credentials, emailData) => {
    try {
    } catch (err) {
      console.error(err);
    }
  },
};
