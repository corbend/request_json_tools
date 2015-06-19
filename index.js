var fs = require('fs');
var path = require('path');
var express = require('express');
var errorHandler = require('error-handler');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var morgan = require('morgan');
var helmet = require('helmet');

var app = express();

var env = process.env.NODE_ENV || 'development';
var port = 80;

if (env == "development") {
    port = 3000;
}

//app.use(errorHandler());
//app.use(morgan('combined'));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "js")));
app.use('/bower_components', express.static(path.join(__dirname, "/bower_components")));
app.use(helmet());
app.set('views engine', 'jade');
app.set('views', __dirname + "/views");

var server = require('http').createServer(app);
var io = require('socket.io')(server);

var conf = JSON.parse(fs.readFileSync('config.json'));
console.log("READ CONFIG->", conf);

mongoose.connect(conf.dbPath, function(connection) {

    console.log(arguments);
    require('./models/Request');
    require('./models/Template');
    require('./models/Test');
    require('./models/TestBlock');

    var Request = mongoose.model('Request');
    var Template = mongoose.model('Template');
    var Test = mongoose.model('Test');
    var TestBlock = mongoose.model('TestBlock');

    Request.find(function(err, requests) {
        if (!err) {
            if (!requests || !requests.length) {
                Request.create({
                    host: '127.0.0.1',
                    port: port,
                    url: 'test',
                    method: 'POST',
                    template: {
                        testParam: 'a'
                    }
                }, function(err, templateRequest) {
                    console.log("TEMPLATE REQUEST CREATE->");
                })
            }
        }
    })

    require('./routes')(app, io);
    require('./template_routes')(app, io);
    require('./controllers/RequestsController')(app, Request, io);
    require("./controllers/TestController")(app, Test, io);
    require("./controllers/TestBlockController")(app, TestBlock, io);

    if (connection) {


        // connection.on('open', function() {
        //     console.log("MONGODB OPEN->");
        // })

        // connection.on('error', function(err) {
        //     console.log("MONGODB ERROR", err);
        // })
    }
});

io.on('connection', function(socket) {

    var requester = require('./requester')(app, conf, socket);

    console.log("CONNECT SOCKETIO->");
    socket.on('message', function(msg) {
        console.log("RECEIVE MESSAGE->", msg);
        if (msg.method) {
            requester.sendByMethod(msg.method);
        }
    })
})

server.listen(port, function() {
    console.log("SERVER UP ON PORT->", port);
});