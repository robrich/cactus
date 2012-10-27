/*global node:true */
"use strict";

//
// The server
//

var express = require("express"),
	io = require("socket.io"),
	http = require("http");

var app = express(),
	server = http.createServer(app),
	sio = io.listen(server);

app.use(express.static(__dirname+'/www'));

sio.configure(function () {
	/*
	https://github.com/learnboost/socket.io/wiki/Configuring-Socket.IO
	0 - error
	1 - warn
	2 - info
	3 - debug
	*/
	sio.set('log level', 1);
});

var port = process.env.PORT || 8090;
server.listen(port, function () {
	console.log("Listening on "+port);
});

// Store state so we can broadcast it to clients that connect late or reconnect
var rooms = {};

// -server is "from server to client"
// -client is "from client to server"
sio.sockets.on('connection', function (socket) {
	var theRoom = null;
	
	var broadcast = function (event, data) {
		sio.sockets.in(theRoom.room).emit(event, data)
	};

	socket.on('connect-client', function (data) {
		var room = 's-'+data;
		if (room === 's-' || room === 's-[object Object]') {
			socket.disconnect(); // You fail
			return;
		}

		// Create the session if it doesn't exist
		if (!Object.prototype.hasOwnProperty.call(rooms, room)) {
			rooms[room] = {
				drawing: [],
				img: null,
				room: room
			};
		}
		theRoom = rooms[room];
		socket.join(room);

		// Replay old data to the user
		if (theRoom.img) {
			theRoom.img.drawing = theRoom.drawing;
			socket.emit("image-server", theRoom.img);
			theRoom.img.drawing = undefined;
		} else if (theRoom.drawing.length > 0) {
			socket.emit("drawing-server", theRoom.drawing);
		}
	});

	socket.on('line-client', function (data) {
		if (!theRoom) {
			socket.disconnect();
			return;
		}
		theRoom.drawing.push(data);
		broadcast("line-server",data);
	});

	socket.on('image-client', function (data) {
		if (!theRoom) {
			socket.disconnect();
			return;
		}
		theRoom.img = data;
		theRoom.drawing = []; // Image overwrites it
		broadcast("image-server",data);
	});

	socket.on('clear-client', function (data) {
		if (!theRoom) {
			socket.disconnect();
			return;
		}
		theRoom.drawing = [];
		theRoom.img = null;
		broadcast("clear-server",data);
	});

});
