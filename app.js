var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var client_ids = [];
var client_id = "";

var num_connections = 0;

app.use(express.static(__dirname + '/public'));

app.get('/server', function(req, res, next){
    debugger;
    res.sendFile(__dirname + '/public/server.html') ;
});

app.get('/client', function(req, res, next) {
    debugger;
    res.sendFile(__dirname + '/public/client.html');
});



//server listens for connections
io.sockets.on('connection', function(client) {
    var username = "client";

    console.log('Client connected...');

    client_ids[num_connections] = client.id;
    num_connections++;
    console.log("Connections: "+num_connections);
    client.on('disconnect', function() {
        console.log('Got disconnect!');
        num_connections--;
        console.log("Connections: "+num_connections);
        var i = client_ids.indexOf(client.id);
        client_ids.splice(i, 1);
    });


    client.emit('init', num_connections);


    client_id = client_ids[num_connections-1];


    debugger;


    client.on ('changeUsername', function (msg) {
        if(msg!="") {
            username = msg;
        }
    });


    //server waits for message from any client
    client.on('join', function(data) {
        console.log(data);
    });

    //when server receives messages from either client
    client.on('messages', function(data) {

        console.log("Message passing through: " + data);



        client.broadcast.emit('broad', {
            username: username,
            message: data});
    });

});



server.listen(4200);