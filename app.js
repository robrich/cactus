var express = require("express")
var io = require("socket.io")

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);

server.listen(8090);

var drawing = [];
var img = null;

io.sockets.on('connection', function (socket) {
  if (img) {
    socket.emit("image-server", img, function () {
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
