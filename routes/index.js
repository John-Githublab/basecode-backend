var express = require('express');
var router = express.Router();
const connection = require('../config/connection');
const returnCode = require('../config/responseCode').returnCode;
const UtilController = require('../api/controller/services/UtilController');

router.use(function(req, res, next) {
  //console.log('index router');
  next();
});

router.get('/', (req, res, next) => {
  res.status(200).send("index home page");
});
router.get('/intro/screens', (req, res, next) => {
  res.status(200).send({
    result:[  {
          type: 'image',
          url: 'https://davaguide.s3.ap-south-1.amazonaws.com/icons/slider3.png',
          link: 'https://www.amazon.in/Ovaltine-Malt-Beverage-Mix-400g/dp/B0048U7ULK',
          content: 'Covid info'
        },
        {
            type: 'image',
            url: 'https://davaguide.s3.ap-south-1.amazonaws.com/icons/slider2.png',
            link: 'https://www.amazon.in/Ovaltine-Malt-Beverage-Mix-400g/dp/B0048U7ULK',
            content: 'Covid info'
          },
          {
              type: 'image',
              url: 'https://davaguide.s3.ap-south-1.amazonaws.com/icons/slider1.png',
              link: 'https://www.amazon.in/Ovaltine-Malt-Beverage-Mix-400g/dp/B0048U7ULK',
              content: 'Covid info'
            }]
  });
});
router.get('/config/aws', (req, res, next) => {
  let responseCode = returnCode.invalidSession;
  let awsCredentials = {};
  if (!(UtilController.isEmpty(req.session.userId))) {
    responseCode = returnCode.validSession;
    awsCredentials = connection.aws;
  }else {
    awsCredentials = connection.aws;
  }
  UtilController.sendSuccess(req, res, next, {
    responseCode,
    aws: awsCredentials
  });
});

router.get("/app/*", (req, res, next) => {
  // res.status(200).send("index home page");
  console.log("build index.html");
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

module.exports = router;
