module.exports = {
  dbUrl:
    "mongodb+srv://geek023:Rscubo8L6v8cqSWn@cluster0.lr8pp.mongodb.net/geeks?retryWrites=true&w=majority",
  backup: {
    db: {
      path: "/home/ec2-user/_backup", // chage here based on os E://Clients/Myanmar/MyanPro/_backup
    },
  },
  aws: {
    CognitoIdentityCredentials: {
      IdentityPoolId: "ap-south-1:649af36f-e5a4-4138-8b30-1b2c67a5b4e6",
      region: "ap-south-1",
    },
    accessKeyId: "AKIA44Q7KKCMVUKGEWWP",
    secretAccessKey: "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",
    smtpAccessKeyId: "AKIAVZSKAPZUMDOIUWQR",
    smtpSecretAccessKey: "BITjpfyduWf5AKisdIXJTsKVkvZ++f9lRLM5IfBwwqQD",
    region: "ap-south-1",
    bucket: "myanclinic",
    link: "",
  },
  smsGateway: {
    provider: "gupshup",
    aPIUrl: "http://enterprise.smsgupshup.com/GatewayAPI/rest?",
    userName: "2000177343",
    password: "GupOtp",
    apiToken: "",
    authorization: "",
    senderId: "WINKIN",
  },
  emailGateway: {
    provider: "aws",
    server: "aws.com",
    userName: "AKIA5G4WQMXF5XDOYGWA",
    password: "fKTsBmQnXs5EO3FEnp0a93Wus8tqnMv7xa8xyVmj",
    region: "us-east-1",
    senderEmail: "Hoblist<notification@hoblist.com>",
    replyToEmail: "notification@hoblist.com",
  },

  googleApis: {
    coordinatesApi: "https://maps.googleapis.com/maps/api/place/details/json",
    locationsApi:
      "https://maps.googleapis.com/maps/api/place/queryautocomplete/json",
    apiKey: "AIzaSyC7x8VBCtgqBYSjD3TPubTFmylJg0SW1VM",
  },

  razorpay: {
    key_id: "",
    key_secret: "",
  },
  hostName: "http://localhost:3000",
};
