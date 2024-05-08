var createError = require("http-errors");
var express = require("express");
var path = require("path");
var multer = require("multer");
var session = require("express-session");
var cors = require("cors");
var xss = require("xss-clean");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var logger = require("morgan");
// mongodb configuration
const dbConnection = require("./bin/DbConnection.ts");
const connection = require("./config/connection");
// connection related
const corsOptions = require("./bin/CorsOptions.ts");
const sessionCallbackFn = require("./bin/Session.ts");
//error related
const errorHandler = require("./bin/ErroHandler.ts");
// routes
const admin = require("./routes/admin");
const user = require("./routes/user");
const auth = require("./features/auth/Routes.js");
const index = require("./routes/index");
//controller
const AuthController = require("./api/controller/services/AuthorizationController");

//root of express
var app = express();
//db connection with mongoose
dbConnection(connection);

app.use(cors(corsOptions));
app.use(express.json());
app.use(
  express.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(xss());
app.use(multer());
app.use(sessionCallbackFn);
app.use(cookieParser());

// static path serving
app.use(express.static(path.join(__dirname, "public")));
app.use("/app", express.static(path.join(__dirname, "build")));

// authentication for each request
app.use("/", function (req, res, next) {
  AuthController.checkRequestAuth(req, res, next);
});
// routes for path
app.use("/v1/auth", auth);
app.use("/admin", admin);
app.use("/user", admin);
app.use("/", index);

// catch 404 and forward to error handler
app.use(errorHandler.error400);

// error handler
app.use(errorHandler.error500);

module.exports = app;
