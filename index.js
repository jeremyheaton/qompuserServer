
const throng = require('throng');

const server = () => {
    const app = require('express')();
    const express = require('express');
    const server = require('http').Server(app);
    const io = require('socket.io')(server);
    const redis = require('redis').createClient;
    const adapter = require('socket.io-redis');
    const path = require('path');
    const { RateLimiterRedis } = require('rate-limiter-flexible');
    const redisClient = redis(12839, "ec2-54-160-82-23.compute-1.amazonaws.com", {
        auth_pass: "p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16"
    });

    io.set('transports', ['websocket']);
    redisClient.flushdb(function (err, succeeded) {
        console.log(succeeded); // will be true if successfull
    });
    const pub = redis(process.env.REDIS_PORT || 12839, process.env.REDIS_URL || 'ec2-54-160-82-23.compute-1.amazonaws.com', {
        detect_buffers: true,
        return_buffers: false,
        auth_pass: process.env.REDIS_PASSWORD || 'p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16'
    });
    const sub = redis(process.env.REDIS_PORT || 12839, process.env.REDIS_URL || 'ec2-54-160-82-23.compute-1.amazonaws.com', {
        return_buffers: true,
        auth_pass: process.env.REDIS_PASSWORD || 'p694b579e54cc038e09d6ecd68db881fe7fd4845edc459ac5bdd377640000bb16'
    });



    const rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        points: 10, // Number of points
        duration: 1, // Per second
    });

    io.adapter(adapter({ pubClient: pub, subClient: sub }));
    app.set('port', (process.env.PORT || 8888));
    // Serve the static files from the React app
    app.use(express.static(path.join(__dirname, 'client/build')));

    // An api endpoint that returns a short list of items
    app.get('/client/:room', (req, res) => {
        res.sendFile(path.join(__dirname + '/client/build/index.html'));
    });

    pub.on("error", function (err) {
        console.log("Error " + err);
    });

    sub.on("error", function (err) {
        console.log("Error " + err);
    });

    io.sockets.on('connection', (socket) => {

        socket.on('subscribe', async (room) => {
            try {
                await rateLimiter.consume(socket.handshake.address);
                console.log("subscribed:" + room);
                socket.join(room);
                redisClient.get(room, (error, result) => {
                    console.log("getting cache:" + JSON.parse(result));
                    console.log("getting cache error:" + error);
                    if (result) {
                        socket.emit('playlist', JSON.parse(result));
                    }
                });
                io.sockets.in(room).emit('fetchtoken');
            } catch (error) {
                console.log(error);
            }
        });

        socket.on('sendtoken', async (data) => {
            try {
                await rateLimiter.consume(socket.handshake.address);
                console.log('get rooms' + io.sockets.adapter.rooms);
                io.sockets.in(data.room).emit('sendtoken', data.token);
            } catch (error) {
                console.log(error);

            }
        });

        socket.on('addSong', async (data) => {
            try {
                await rateLimiter.consume(socket.handshake.address);
                console.log("attempting to add song");
                io.sockets.in(data.room).emit('message',
                    { room: data.room, message: data.message, song: data.song, artist: data.artist });
            } catch (error) {
                console.log(error);

            }
        });

        socket.on('sendplaylist', async (data) => {
            try {
                await rateLimiter.consume(socket.handshake.address);
                console.log("adding cache to:" + data.room);
                redisClient.set(data.room, JSON.stringify(data));
                io.sockets.in(data.room).emit('playlist', data);
            } catch (error) {
                console.log(error);

            }
        });
    });

    server.listen(app.get('port'), function () {
        console.log('Node app is running on port', app.get('port'));
    });
}

throng(process.env.WEB_CONCURRENCY||4, server);
