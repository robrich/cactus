/*global node:true */
"use strict";

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

server.listen(8090);

// Store state so we can broadcast it to clients that connect late or reconnect
var drawing = [];
var img = null;

// -server is "from server to client"
// -client is "from client to server"
sio.sockets.on('connection', function (socket) {
	if (img) {
		img.drawing = drawing;
		socket.emit("image-server", img);
		img.drawing = undefined;
	} else {
		socket.emit("drawing-server", drawing);
	}
	socket.on('line-client', function (data) {
		drawing.push(data);
		socket.broadcast.emit("line-server",data);
	});

	socket.on('image-client', function (data) {
		img = data;
		drawing = []; // Image overwrites it
		socket.broadcast.emit("image-server",data);
	});

	socket.on('clear-client', function (data) {
		drawing = [];
		img = null;
		socket.broadcast.emit("clear-server",data);
	});
});
