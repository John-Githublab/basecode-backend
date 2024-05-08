var express = require("express");
var router = express.Router();

router.use(function (req, res, next) {
  // middleware specifc for user route
  next();
});

/* GET users related listing. */
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

// user related apis goes below

module.exports = router;
