var express = require("express")
var io = require("socket.io")

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);

server.listen(8090);

io.sockets.on('connection', function (socket) {

  socket.on('line-client', function (data) {
    console.log("line info: ",data);
    socket.broadcast.emit("line-server",data);
  });
});
