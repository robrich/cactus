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
var sessions = {};

// -server is "from server to client"
// -client is "from client to server"
sio.sockets.on('connection', function (socket) {
	var socketSession = null;
	
	var broadcast = function (event, data) {
		sio.sockets.in(socketSession.room).emit(event, data)
	};

	socket.on('connect-client', function (data) {
		var room = 's-'+data;
		if (room === 's-' || room === 's-[object Object]') {
			socket.disconnect(); // You fail
			return;
		}

		// Create the session if it doesn't exist
		if (!Object.prototype.hasOwnProperty.call(sessions, room)) {
			sessions[room] = {
				drawing: [],
				//sockets: [],
				img: null,
				room: room
			};
		}
		socketSession = sessions[room];
		socket.join(room);
		//socketSession.sockets.push(socket);

		// Replay old data to the user
		if (socketSession.img) {
			socketSession.img.drawing = socketSession.drawing;
			socket.emit("image-server", socketSession.img);
			socketSession.img.drawing = undefined;
		} else if (socketSession.drawing.length > 0) {
			socket.emit("drawing-server", socketSession.drawing);
		}
	});

	socket.on('line-client', function (data) {
		if (!socketSession) {
			socket.disconnect();
			return;
		}
		socketSession.drawing.push(data);
		broadcast("line-server",data);
	});

	socket.on('image-client', function (data) {
		if (!socketSession) {
			socket.disconnect();
			return;
		}
		socketSession.img = data;
		socketSession.drawing = []; // Image overwrites it
		broadcast("image-server",data);
	});

	socket.on('clear-client', function (data) {
		if (!socketSession) {
			socket.disconnect();
			return;
		}
		socketSession.drawing = [];
		socketSession.img = null;
		broadcast("clear-server",data);
	});

});
