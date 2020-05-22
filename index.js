var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');
var pub = redis(7809, "ec2-18-204-191-194.compute-1.amazonaws.com", {auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"});
var sub = redis(7809, "ec2-18-204-191-194.compute-1.amazonaws.com", {
    return_buffers: true,
    auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"
});
//
io.adapter(adapter({pubClient: pub, subClient: sub}));
var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
app.set('port', (process.env.PORT || 8888));
app.use(express.static('public'));
// var client_id = 'd3bfb36d744c491db757c2819dac73eb'; // Your client id
// var client_secret = 'f27f1a4a55404be99e6beb153c54278b'; // Your client secret

// app.use(express.static(path.join(__dirname, 'client/build')));

// // Handles any requests that don't match the ones above
// app.get('/client/:room', (req,res) =>{
//     res.sendFile(path.join(__dirname+'/client/build/index.html'));
// });

io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function (room) {
        console.log(room);
        socket.join(room);

        socket.on('sendToken', function (authCode) {
            console.log(authCode);
            io.sockets.in(room).emit('sendToken', authCode);
        });

        io.sockets.in(room).emit('fetchToken');

        console.log(room + ': connected');
        io.sockets.in(room).emit('fetchplaylist');
    });

    socket.on('addSong', function (data) {
        console.log("attempting to add song");
        io.sockets.in(data.room).emit('message',
            {room: data.room, message: data.message, song: data.song, artist: data.artist});
    });

    socket.on('songAdded', function (data) {
        console.log(data);
    });

    socket.on('sendplaylist', function (data) {
        io.sockets.in(data.room).emit('playlist', data);
    });
});

http.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
