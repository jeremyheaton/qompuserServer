const app = require('express')();
const express = require('express');
const server = require('http').Server(app);
const io = require('socket.io')(server);
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');
var pub = redis(12839, "ec2-54-160-82-23.compute-1.amazonaws.com", {
    detect_buffers: true,
    return_buffers: false,
    auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"});
var sub = redis(12839, "ec2-54-160-82-23.compute-1.amazonaws.com", {
    return_buffers: true,
    auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"
});

io.adapter(adapter({pubClient: pub, subClient: sub}));
app.set('port', (process.env.PORT || 8888));
app.use(express.static('public'));
// app.use(express.static(path.join(__dirname, 'client/build')));

// // Handles any requests that don't match the ones above
// app.get('/client/:room', (req,res) =>{
//     res.sendFile(path.join(__dirname+'/client/build/index.html'));
// });
pub.on("error", function (err) {
    console.log("Error " + err);
});

sub.on("error", function (err) {
    console.log("Error " + err);
});

io.sockets.on('connection', (socket) => {

    socket.on('subscribe', (data) => {
        console.log("subscribed:" + data);
        socket.join(data);
        io.sockets.in(data).emit('fetchtoken');
        io.sockets.in(data).emit('fetchplaylist');
        io.sockets.in(data).emit('test', 'hi');

    });
    socket.on('sendtoken', (data) => {
        console.log('get rooms' +  io.sockets.adapter.rooms);
        io.sockets.in(data.room).emit('sendtoken', data.token);
    });

    socket.on('addSong', (data) => {
        console.log("attempting to add song");
        io.sockets.in(data.room).emit('message',
            {room: data.room, message: data.message, song: data.song, artist: data.artist});
    });

    socket.on('songAdded', (data) => {
        console.log(data);
    });

    socket.on('sendplaylist', (data) => {
        console.log(data);
        io.sockets.in(data.room).emit('playlist', data);
    });
});

server.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
