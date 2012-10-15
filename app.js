var express = require("express"),
	io = require("socket.io"),
	http = require("http");

var app = express(),
	server = http.createServer(app),
	sio = io.listen(server);

app.use(express.static(__dirname+'/www'));
server.listen(8090);

var drawing = [];
var img = null;

sio.sockets.on('connection', function (socket) {
	if (img) {
		socket.emit("image-server", img, function () {
			//console.log("sending drawing!!!!!!");
			socket.emit("drawing-server", drawing);
		}); 
	} else {
		socket.emit("drawing-server", drawing);
	}
	socket.on('line-client', function (data) {
		drawing.push(data)
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
