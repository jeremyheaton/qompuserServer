var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');
var pub = redis(7809, "ec2-18-204-191-194.compute-1.amazonaws.com", {
    auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"});
var sub = redis(7809, "ec2-18-204-191-194.compute-1.amazonaws.com", {
    return_buffers: true,
    auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"
});

io.adapter(adapter({pubClient: pub, subClient: sub}));
var express = require('express');
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
    socket.on('sendToken', (room, authCode) => {
        console.log(authCode,room);
        io.sockets.in(room).emit('sendToken', authCode);
    });

    socket.on('subscribe', (data) => {
        console.log(data);
        socket.join(data);
        io.sockets.in(data).emit('fetchToken');
        console.log(data + ': connected');
        io.sockets.in(data).emit('fetchplaylist');
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
        io.sockets.in(data.room).emit('playlist', data);
    });
});

http.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
