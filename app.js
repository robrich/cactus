var express = require("express")
var io = require("socket.io")

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);

server.listen(8090);

var drawing = []

io.sockets.on('connection', function (socket) {
  socket.emit("drawing-server", drawing)
  socket.on('line-client', function (data) {
    drawing.push(data)
    console.log("line info: ",data);
    socket.broadcast.emit("line-server",data);
  });

  socket.on('image-client', function (data) {
    console.log("image")
    socket.broadcast.emit("image-server",data);
  });

  socket.on('clear-client', function (data) {
    drawing = []
    console.log("line info: ",data);
    socket.broadcast.emit("clear-server",data);
  });
});
