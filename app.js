///**
// * var app = require('express')();
// var http = require('http').Server(app);
// var io = require('socket.io')(http);
// * @type {exports|Parsers|module.exports}
// */
//
//var express = require('express');
//var bodyParser   = require('body-parser');
//var path = require('path');
//
//
//var num_connected = 0;
//
//debugger;
//
//var app = require('express')();
//var server = require('http').createServer(app);
//var io = require('socket.io').listen(server);
//
//var myServer = app.listen(3000, function () {
//    console.log("App is now listening on port " + myServer.address().port);
//});
//
//app.use(bodyParser.urlencoded({extended: true}));
//app.use(bodyParser.json());
//
////Loads js/css files from public
//app.use(express.static(path.join(__dirname, "/public")));
//
//debugger;
//
////test server
//app.get('/', function (req, res) {
//
//
//    res.send('Hello World!');
//
//
//});
//
//
////Show number of connected users, etc.
//app.get('/server', function(req, res) {
//
//    debugger;
//    res.sendFile(__dirname + '/public/server.html');
//
//
//
//});
//
////Alice and Bob specific pages
//app.get('/alice', function(req, res) {
//    res.sendFile(__dirname + '/public/alice.html');
//});
//
//app.get('/bob', function(req, res) {
//    res.sendFile(__dirname + '/public/bob.html');
//});
//
////TODO: Socket.IO handling
//
//debugger;
//
//io.on('connection', function(socket){
//
//    debugger;
//    console.log('A user connected! Socket: ' + socket);
//});
//

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var is_authenticated = false;

var client_ids = [];
var alice_id = "";
var bob_id = "";

var client_names = ["alice", "bob"];
var num_connections = 0;




app.use(express.static(__dirname + '/public'));

app.get('/server', function(req, res, next){
    debugger;
   res.sendFile(__dirname + '/public/server.html') ;
});

app.get('/alice', function(req, res, next) {
    debugger;
    res.sendFile(__dirname + '/public/alice.html');
});

app.get('/bob', function(req, res, next) {
    debugger;
    res.sendFile(__dirname + '/public/bob.html');
});

//server listens for connections
io.on('connection', function(client) {

    console.log('Client connected...');



    client_ids[num_connections] = client.id;
    num_connections++;

    if(num_connections == 1){
        alice_id = client_ids[0];
    }
    else{
        bob_id = client_ids[1];
    }
    debugger;

    //server waits for message from any client
    client.on('join', function(data) {
        console.log(data);

       // client.emit('messages', 'Hello from server!');
    });

    //when server receives messages from either client
    client.on('messages', function(data) {

        console.log("Message passing through: " + data);

        //determine which client made the req
        var username = "nobody";

        if(client.id == client_ids[0]){
            username = "Alice";
        }

        else if(client.id == client_ids[1]){
            username = "Bob";
        }

        client.broadcast.emit('broad', {
                                            username: username,
                                            message: data});
    });

});

server.listen(4200);