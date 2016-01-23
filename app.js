var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var http = require('http');

//database
var Record = require('./mongodb/record').Record;
var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/chate'; 


var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

app.set('port', process.env.PORT || 5000);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//app.use('/', routes);
app.use('/users', users);

var MongoClient = require('mongodb').MongoClient;

var DB_CONN_STR = 'mongodb://localhost:27017/chat'; 

MongoClient.connect(DB_CONN_STR, function(err, db){ 
  if(err) {
        console.log('Error:' + err);
  }else {  
    console.log("connect success!");
  }
});


var users = {};// store the user list


app.get('/', function (req, res) {
  if (req.cookies.user == null) {
    res.redirect('/signin');
  } else {
    res.sendfile('views/mainpage.html');
  }
});

app.get('/signin', function (req, res) {
  res.sendfile('views/signin.html');
});

app.post('/signin', function (req, res) {
  if (users[req.body.name]) {   
    res.redirect('/signin');
  } else {
    res.cookie("user", req.body.name, {maxAge: 1000*60*60*24*30});
    res.redirect('/');
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}



var server = http.createServer(app);
var io = require('socket.io').listen(server);

MongoClient.connect(DB_CONN_STR, function(err, db){
  io.sockets.on('connection', function(socket){

    socket.on('online', function(data){
      socket.name = data.user;

      if(!users[data.user]){
        users[data.user] = data.user;
      }

      
      Record.findAll(db, function(result){
          socket.emit('msg-list', result);
      });

      io.sockets.emit('online', {users: users, user: data.user});

    });

    socket.on('say', function(data){
      if(data.to == 'all'){
        socket.broadcast.emit('say', data);

        var r = new Record(data.from, data.to, data.msg);
        r.store(db, function(result){
            for(var i in result) {
              console.log(i + ": " + result[i]);
            }
        });

      }else{
        var clients = io.sockets.clients();
        clients.forEach(function(client){
          if(client.name == data.to){
            client.emit('say'. data);

            var r = new Record(data.from, data.to, data.msg);
            r.store(db, function(result){
              for(var i in result) {
                console.log(i + ": " + result[i]);
              }
            });
            
          }
        });
      }
    });

    socket.on('disconnect', function(){
      if(users[socket.name]){
        delete users[socket.name];
        socket.broadcast.emit('offline', {users: users, user: socket.name});
      }
    });

  });
});


server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
