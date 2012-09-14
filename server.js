/*

Purpose: node.js chat server
Author:  Eric Reinsmidt
Contact: eric@reinsmidt.com
Date:    2012.09.14
Version: 0.0.1

*/

var app = require('http').createServer(handler)
	, io = require('socket.io').listen(app)
	, fs = require('fs')
	, mime = require('mime')
	, url = require('url')
	, path = require('path')
	, redis = require("redis");

var live_users = new Array();
var client = redis.createClient();

client.on("error", function (err) {
	console.log("Error " + err);
});

app.listen(3000);

//io.set('log level', 1);


// handle HTTP requests from clients
function handler (request, response) {
	var pathname = url.parse(request.url).pathname;
	if (pathname == "/") pathname = "index.html";
	var filename = path.join(process.cwd(), pathname);

	path.exists(filename, function(exists) {
		// throw 404 page if no file at requested path
		if (!exists) {
			response.writeHead(404, {"Content-Type": "text/plain"});
			response.write("404 Not Found");
			response.end();
			return;
		}

		// file found, get MIME type and send appropriately
		response.writeHead(200, {'Content-Type': mime.lookup(filename)});
		fs.createReadStream(filename, {
			'flags': 'r',
			'encoding': 'binary',
			'mode': 0666,
			'bufferSize': 4 * 1024
		}).addListener("data", function(chunk) {
			response.write(chunk, 'binary');
		}).addListener("close",function() {
			console.log('Loaded file ' + filename + ' with filetype ' + mime.lookup(filename));
			response.end();
		});
	});
};

// callback function for a new connecting client
io.sockets.on('connection', function (socket) {
	
	// on page load, update user list for new connector
	io.sockets.emit('update_user_list', live_users);

	// attach functions to each connected socket
	handle_message(socket);
	handle_signup(socket);
	handle_login(socket);
	handle_logout(socket);
	handle_add_buddies(socket);
	//handle_get_buddies(socket);

});

// function handle_get_buddies(socket) {
//  socket.on('getBuddies', function() {
//    for (var i = 0; i < live_users.length; i++) {
//      console.log('live user: '+live_users[i]+ '  just joined: '+socket.user);
//          client.sismember(live_users[i]+'_buddies', socket.user, function(err, res) {
//        if (res) {
//          // send user to buddylist
//          user = socket.user;
//          io.sockets.clients().forEach(function (socket) {
//            socket.emit('showBuddies', live_users[i], user);
//          });
//        } else {
//          // do nothing
//        };
//      });
		
//    };
//  });
// };

function handle_add_buddies(socket) {
	socket.on('addToBuddies', function(buddy) {
		console.log('Attempting to add '+buddy+' to '+socket.user+'\'s Buddy list...');
		client.sismember(socket.user+'_buddies', buddy, function(err, res) {
			if (res) {
				// buddy already added
			} else {
				client.sadd(socket.user+'_buddies', buddy);
				console.log('Successfully added '+buddy+' to '+socket.user+'\'s Buddy list!!');
			};
		});
	});
};

// message received from client
function handle_message(socket) {
	
	socket.on('send_message', function(message) {
		if (message !== '') {
			// broadcast message to all
			io.sockets.emit('add_message', '<strong>'+socket.user+'</strong> - '+message+'<br><small>'+Date()+'</small>');
		};
	});
	
};

// new user signup event received
function handle_signup(socket) {
	socket.on('signup', function(user, pass) {
	if (user === '' || pass === '') { // handle empty input
		socket.emit('login_error','Those boxes below...','Ya gotta fill \'em both out ;)');
		return;
	};
	client.hexists(user, 'username', function(err, res) {
		if (res) { // if res === true, user already exists!
			socket.emit('login_error','Great minds think alike!','You have such good taste that someone already chose that username. Please pick another username.');
			console.log('Attempted signup of existing username ' + user);
			return;
		} else { // create new user
			client.hmset(user, 'username', user, 'password', pass);
			socket.user = user;
			socket.pass = pass;
			live_users.push(user);
			io.sockets.emit('add_message', user + ' has logged in');
			io.sockets.emit('update_user_list', live_users);
			socket.emit('allow_chat', socket.user);
			// check for buddies
			// io.sockets.clients().forEach(function (socket) {
				// socket.emit('showBuddies', live_users[i], user);
			// });
			console.log('New user ' + user + ' has signed up.');
		};
	});
	});
};

// existing user login event received
function handle_login(socket) {
	socket.on('login', function(user, pass) {
	if (user === '' || pass === '') { // handle empty input
		socket.emit('login_error','Those boxes below...','Ya gotta fill \'em both out ;)');
		return;
	};
	if (live_users.indexOf(user) !== -1) {
		socket.emit('login_error','Already logged in!','That user is already logged in.');
		return;
	};
	client.hexists(user, 'username', function(err, res) {
		if (res) { // username exists and is not logged in
			client.hgetall(user, function(err, res2) {
				if (res2.password === pass) {
				socket.user = user;
				socket.pass = pass;
				live_users.push(user);
				io.sockets.emit('add_message', user + ' has logged in');
				io.sockets.emit('update_user_list', live_users);
				socket.emit('allow_chat', socket.user);
				// tell buddies you logged in
				io.sockets.clients().forEach(function (socket2) {
					client.sismember(socket2.user+'_buddies', user, function(err, res) {
						if (res) {
							socket2.emit('buddyJoined', user);
							console.log('your buddy '+user+' joined.');
						};
					});
					client.sismember(user+'_buddies', socket2.user, function(err, res) {
						if (res) {
							socket.emit('buddyIsHere', socket2.user);
							console.log('Checked '+user+'_buddies, and your buddy '+socket2.user+' is here already.');
						};
					});
				});
				console.log('user = ' + user + ' has successfully logged in with password ' + pass);
				} else { // password didn't match
					socket.emit('login_error','Hmmmm.','Something\'s not right. Please recheck your username and password.');
				};
			});
		} else { // username doesn't exist
			socket.emit('login_error','Hmmmm.','Something\'s not right. Please recheck your username and password.');
		};
	});
	});
};

// client disconnected
function handle_logout(socket) {
	socket.on('disconnect', function() {
		// only broadcast if user was logged in
		if (socket.user) {
			io.sockets.emit('add_message', socket.user + ' has logged out');
			var i = live_users.indexOf(socket.user);
			live_users.splice(i,1);
			io.sockets.emit('update_user_list', live_users);
			// empty from connected users buddy lists
			io.sockets.clients().forEach(function (socket2) {
				client.sismember(socket2.user+'_buddies', socket.user, function(err, res) {
					if (res) {
						socket2.emit('buddyLeft', socket.user);
						console.log('your buddy '+socket.user+' left.');
					};
				});
			});
		};
	});
};