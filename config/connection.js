module.exports = {
  dbUrl:'mongodb+srv://geek023:Rscubo8L6v8cqSWn@cluster0.lr8pp.mongodb.net/myanclinic?retryWrites=true&w=majority',
    backup:{
      db:{
        path:"/home/ec2-user/_backup" // chage here based on os E://Clients/Myanmar/MyanPro/_backup
      }
    },
  aws: {
    CognitoIdentityCredentials: {
      IdentityPoolId: 'ap-south-1:649af36f-e5a4-4138-8b30-1b2c67a5b4e6',
      region: 'ap-south-1',
    },
    accessKeyId: 'AKIA44Q7KKCMVUKGEWWP', // hoblist access key "AKIA5G4WQMXF5XDOYGWA", // pimaer access key"AKIAVZSKAPZUM3BMM6FZ",
    secretAccessKey: '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', //"fKTsBmQnXs5EO3FEnp0a93Wus8tqnMv7xa8xyVmj", //"aCHVX7DWauWyGxLoLPAPy7v5XjuCiv96FhKB5USl",
    smtpAccessKeyId: 'AKIAVZSKAPZUMDOIUWQR',
    smtpSecretAccessKey: 'BITjpfyduWf5AKisdIXJTsKVkvZ++f9lRLM5IfBwwqQD',
    region: 'ap-south-1', //ap-south-1  us-east-2
    bucket: 'myanclinic',
    // inventory: 'myanclinic/inventory',
    inventoryUploadItems: 'myanclinic/inventory/uploadItems',
    inventoryUploadStock: 'myanclinic/inventory/uploadStock',
    inventoryUploadImages: 'myanclinic/inventory/uploadImage/image',
    inventoryUploadExcel: 'myanclinic/inventory/uploadImage/excel',
    inventoryUploadProcessed: 'myanclinic/inventory/processed',
    inventoryUploadError: 'myanclinic/inventory/error',
    // uploadItems: '/uploadItems',
    // uploadStock: '/uploadStock',
    // images: '/uploadImage/image',
    // excel: '/uploadImage/excel',
    photosBucket: '',
    prescriptionBucket: '',
    doctorBucket: 'myanclinic/doctor', // doctor profile images
    clinicBucket: 'myanclinic/clinic',// this is to upload clinic or hospital images
    invoicesBucket: 'myanclinic/modules',
    attachmentsBucket: 'myanclinic/attachment',
    userBucket: 'myanclinic/user',
    link: 'https://s3.ap-south-1.amazonaws.com/',
  },
  smsGateway: {
    provider: 'gupshup',
    aPIUrl: 'http://enterprise.smsgupshup.com/GatewayAPI/rest?',
    userName: '2000177343',
    password: 'GupOtp',
    apiToken: '',
    authorization: '',
    senderId: 'WINKIN',
  },
  emailGateway: {
    provider: 'aws',
    server: 'aws.com',
    userName: 'AKIA5G4WQMXF5XDOYGWA',
    password: 'fKTsBmQnXs5EO3FEnp0a93Wus8tqnMv7xa8xyVmj',
    region: 'us-east-1',
    senderEmail: 'Hoblist<notification@hoblist.com>',
    replyToEmail: 'notification@hoblist.com',
  },

  // razorpay: {
  //   key_id: 'rzp_test_J5vFcCXdPM6fRR',
  //   key_secret: 'lTRTXkOKydp39lrQZHM6HCLl'
  // },
  // hostName: 'http://localhost:3000'
  hostName: 'http://myanclinic.com/app',
};
