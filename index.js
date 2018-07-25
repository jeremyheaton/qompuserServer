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
io.adapter(adapter({pubClient: pub, subClient: sub}));
var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
app.set('port', (process.env.PORT || 8888));
app.use(express.static('public'));
var client_id = 'd3bfb36d744c491db757c2819dac73eb'; // Your client id
var client_secret = 'f27f1a4a55404be99e6beb153c54278b'; // Your client secret
var redirect_uri = (process.env.REDIRECT_URI || 'http://localhost:8888/callback'); // Your
var authCode = null;																					// redirect
// var redirect_uri = 'https://ancient-tor-6266.herokuapp.com/callback'; // Your
// redirect uri

app.get('/client/:room', function (req, res) {
    res.sendFile('public/client.html', {
        root: __dirname
    })
});


io.sockets.on('connection', function (socket) {
    socket.on('subscribe', function (room) {
        socket.join(room);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            headers: {
                'Authorization': 'Basic ' + 'ZDNiZmIzNmQ3NDRjNDkxZGI3NTdjMjgxOWRhYzczZWI6ZjI3ZjFhNGE1NTQwNGJlOTllNmJlYjE1M2M1NDI3OGI='
            },
            form: {
                grant_type: 'client_credentials'
            },
            json: true
        };
        if (authCode == null) {
            request.post(authOptions, function (error, response, body) {
                authCode = body.access_token;
            });
        }
        io.sockets.in(room).emit('token', authCode);
        console.log(room + ': connected')
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


app.get('/refresh_token', function (req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: {
            'Authorization': 'Basic '
            + (new Buffer(client_id + ':' + client_secret)
                .toString('base64'))
        },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

http.listen(app.get('port'), function () {
    console.log('Node app is running on port', app.get('port'));
});
