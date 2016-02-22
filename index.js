/**
 * This is an example of a basic node.js script that performs the Authorization
 * Code oAuth2 flow to authenticate against the Spotify Accounts.
 * 
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
var app = require('express')();

var http = require('http').Server(app);
var io = require('socket.io')(http);
var redis = require('redis').createClient;
var adapter = require('socket.io-redis');

var pub = redis(8309, "ec2-54-227-252-69.compute-1.amazonaws.com", { auth_pass: "p76ntnifvt971g3nfh5ii7ftoup" });
var sub = redis(8309, "ec2-54-227-252-69.compute-1.amazonaws.com", { return_buffers: true, auth_pass: "p76ntnifvt971g3nfh5ii7ftoup" });
io.adapter(adapter({ pubClient: pub, subClient: sub }));

var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
app.set('port', (process.env.PORT || 8888));
app.use(express.static(__dirname + '/public')).use(cookieParser());
var client_id = 'd3bfb36d744c491db757c2819dac73eb'; // Your client id
var client_secret = 'f27f1a4a55404be99e6beb153c54278b'; // Your client secret
var redirect_uri = (process.env.REDIRECT_URI || 'http://localhost:8888/callback'); // Your
																					// redirect
																					// uri
// var redirect_uri = 'https://ancient-tor-6266.herokuapp.com/callback'; // Your
// redirect uri

app.get('/client/:room', function(req, res){
	  res.sendFile(__dirname + '/public/client.html');
	});


io.sockets.on('connection', function(socket){
    socket.on('subscribe', function(room) { 
        console.log('joining room', room);
        socket.join(room); 
    });
    
  
    socket.on('send', function(data) {
        console.log('sending message');
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
          });
    
});
    
});
/**
 * Generates a random string containing numbers and letters
 * 
 * @param {number}
 *            length The length of the string
 * @return {string} The generated string
 */
var generateRandomString = function(length) {
	var text = '';
	var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

	for (var i = 0; i < length; i++) {
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	}
	return text;
};

var stateKey = 'spotify_auth_state';

app.get('/login', function(req, res) {
	var state = generateRandomString(16);
	res.cookie(stateKey, state);
					// your application requests authorization
	var scopes = 'user-read-email playlist-read-private user-read-private playlist-modify-public';
	res.redirect('https://accounts.spotify.com/authorize'
				+ '?response_type=code'
				+ '&client_id='
				+ client_id
				+ (scopes ? '&scope='
					+ 'playlist-read-private%20playlist-modify%20playlist-modify-private' : '')
				+ '&redirect_uri='
				+ encodeURIComponent(redirect_uri)
				+ '&state=' + state);
				});

app.get('/getplaylists', function(req, res) {
	var authOptions = {
		url : 'https://api.spotify.com/v1/users/' + req.param('userid')
				+ '/playlists',
		headers : {
			'Authorization' : 'Bearer ' + req.param('accesstoken')
		},
		json : true
	};
	request.get(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var array = [];

			for (i = 0; i < body.items.length; i++) {
				var playlist = new Object(); // or var map = {};
				playlist['playlistname'] = body.items[i].name;
				playlist['playlistid'] = body.items[i].id;
				array.push(playlist);
			}
			;
			res.send(array);
		} else {
			res.send('not valid');
		}
	});

});
app.post('/addtoplaylist', function(req, res) {
	var authOptions = {
		url : 'https://api.spotify.com/v1/users/' + req.param('userid')
				+ '/playlists/' + req.param('selectedplaylistid')
				+ '/tracks?uris=spotify%3Atrack%3A' + req.param('song'),
		headers : {
			'Authorization' : 'Bearer ' + req.param('accesstoken')
		},
		json : true
	};

	request.post(authOptions, function(error, response, body) {
		// console.log(body);
		if (!error && response.statusCode === 201) {

			var access_token = body
			console.log(response.statusCode);
			res.sendStatus(response.statusCode);
		} else {
			res.send('not valid');
		}
	});
});
app
		.get(
				'/callback',
				function(req, res) {

					// your application requests refresh and access tokens
					// after checking the state parameter

					var code = req.query.code || null;
					var state = req.query.state || null;
					var storedState = req.cookies ? req.cookies[stateKey]
							: null;
					if (state === null || state !== storedState) {
						res.redirect('/#' + querystring.stringify({
							error : 'state_mismatch'
						}));
					} else {
						res.clearCookie(stateKey);
						var authOptions = {
							url : 'https://accounts.spotify.com/api/token',
							form : {
								code : code,
								redirect_uri : redirect_uri,
								grant_type : 'authorization_code'
							},
							headers : {
								'Authorization' : 'Basic '
										+ (new Buffer(client_id + ':'
												+ client_secret)
												.toString('base64'))
							},
							json : true
						};

						request
								.post(
										authOptions,
										function(error, response, body) {
											if (!error
													&& response.statusCode === 200) {

												var access_token = body.access_token, refresh_token = body.refresh_token;

												var options = {
													url : 'https://api.spotify.com/v1/me',
													headers : {
														'Authorization' : 'Bearer '
																+ access_token
													},
													json : true
												};

												// use the access token to
												// access the Spotify Web API
												request.get(options, function(
														error, response, body) {
												});

												// we can also pass the token to
												// the browser to make requests
												// from there
												res
														.redirect('/#'
																+ querystring
																		.stringify({
																			access_token : access_token,
																			refresh_token : refresh_token
																		}));
											} else {
												res
														.redirect('/#'
																+ querystring
																		.stringify({
																			error : 'invalid_token'
																		}));
											}
										});
					}
				});

app.get('/refresh_token', function(req, res) {

	// requesting access token from refresh token
	var refresh_token = req.query.refresh_token;
	var authOptions = {
		url : 'https://accounts.spotify.com/api/token',
		headers : {
			'Authorization' : 'Basic '
					+ (new Buffer(client_id + ':' + client_secret)
							.toString('base64'))
		},
		form : {
			grant_type : 'refresh_token',
			refresh_token : refresh_token
		},
		json : true
	};

	request.post(authOptions, function(error, response, body) {
		if (!error && response.statusCode === 200) {
			var access_token = body.access_token;
			res.send({
				'access_token' : access_token
			});
		}
	});
});


app.post('/host/:room/', function(req, res) {
	
    var room = req.params.room
        message = req.param('songid')
        song = req.param('song')
    	source = req.param('source')
    	
    console.log(room + ", " + message + ", " + source);
    io.sockets.in(room).emit('message', { room: room, message: message, song: song, source: source });
   
    res.end('message sent');
});

http.listen(app.get('port'), function() {
	console.log('Node app is running on port', app.get('port'));
});
