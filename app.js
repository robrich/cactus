var express = require("express")
var io = require("socket.io")

var app = express()
  , server = require('http').createServer(app)
  , io = io.listen(server);

server.listen(8090);

io.sockets.on('connection', function (socket) {

  socket.on('line', function (color,x1,y1,x2,y2) {
    console.log("line info: ",color,x1,y1,x2,y2);
    socket.broadcast.emit("line",color,x1,y1,x2,y2);
  });
});
