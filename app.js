var createError = require('http-errors');
var express = require('express');
var path = require('path');
var multer = require('multer');
var session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var cors = require('cors');
var xss = require('xss-clean');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var logger = require('morgan');
// var compression = require('compression')

var admin = require('./routes/admin');
var user = require('./routes/user');
var index = require('./routes/index');
const AuthController = require('./api/controller/services/AuthorizationController');

var app = express();

// mongodb configuration
const mongoose = require('mongoose');
const connection = require('./config/connection');
// if there is not database then mongodb will not initialise. but if give db url then automatically create db instance
if (!(connection.dbUrl === undefined || connection.dbUrl.length <= 0)) {
  mongoose.set('debug', false);
  mongoose.Promise = require('bluebird');
  mongoose.Promise = global.Promise;
  mongoose.connect(connection.dbUrl, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  });
  let db = mongoose.connection;
  db.once('open', function () {
    console.log('Db connnected');
  });
  db.on('error', function (err) {
    console.error(err);
  });
}
// mongodb configuration ends here

// view engine setup
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

//app.use(logger('dev'));
var corsOptions = {
  origin: 'http://localhost:3000', // webpack dev server port
  //  origin: 'http://54.169.115.104:4001',
  // origin: 'http://davaguide.com',
  credentials: true,
};
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
// app.use(compression());
app.use(
  session({
    secret: 'davaguide',
    resave: false, //don't save session if unmodified
    saveUninitialized: true,
    store: new MongoStore({
      mongooseConnection: mongoose.connection,
      //touchAfter: 24 * 3600, // time period in seconds
      ttl: 30 * 24 * 60 * 60, // = 14 days. Default
      autoRemove: 'native', // Default
    }),
    rolling: true,
    cookie: {
      originalMaxAge: 30 * 24 * 60 * 60 * 1000,
      maxAge: 30 * 24 * 60 * 60 * 1000,
      secure: false,
      // expires: new Date(Date.now() + 300000),
    },
  })
);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/app', express.static(path.join(__dirname, 'build')));

// authentication for each request
app.use('/', function (req, res, next) {
  //console.log('checkRequestAuth');
  AuthController.checkRequestAuth(req, res, next);
  //next()
});

app.use('/admin', admin);
app.use('/user', user);
app.use('/', index);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  //next(err);
  // res.status(404).render('404', {
  //   title: 'Oops! Not found'
  // });
  res.status(404).send({
    title: 'Oops! Not found',
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  //res.render('error');
  if (err.status === 500) {
    console.log(err.status);
    res.status(500).send({
      title: 'Oops! Server internal error',
      //message: err.message,
      //error: err
    });
  }

  //res.redirect('/login');
});

module.exports = app;
