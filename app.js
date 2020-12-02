var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');

//라우터 불러오기
var indexRouter = require('./routes/index');
var entrepRouter = require('./routes/entrep');
var memberRouter = require('./routes/members');
var orderRouter = require('./routes/orders');

var app = express();

app.use(session({
  secret:'@#@$DBTEAM#@$#$',
  resave: true,
  saveUninitialized: true
}));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//라우터 등록
app.use('/', indexRouter);
app.use('/members', memberRouter);
app.use('/entrep',entrepRouter);
app.use('/order',orderRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

var server = app.listen(3000, function(){
    console.log("Express server has started on port 3000");
});

module.exports = app;
