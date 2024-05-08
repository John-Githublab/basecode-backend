const Mongoose = require("mongoose");
var session = require("express-session");
const MongoStore = require("connect-mongo")(session);

module.exports = session({
  secret: "project",
  resave: false, //don't save session if unmodified
  saveUninitialized: true,
  store: new MongoStore({
    mongooseConnection: Mongoose.connection,
    //touchAfter: 24 * 3600, // time period in seconds
    ttl: 30 * 24 * 60 * 60, // = 14 days. Default
    autoRemove: "native", // Default
  }),
  rolling: true,
  cookie: {
    originalMaxAge: 30 * 24 * 60 * 60 * 1000,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    secure: false,
    // expires: new Date(Date.now() + 300000),
  },
});
