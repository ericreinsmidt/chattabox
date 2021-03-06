/*

Purpose: node.js chat server
Author:  Eric Reinsmidt
Contact: eric@reinsmidt.com
Date:    2012.09.18
Version: 0.1.1

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
var rooms = ['general'];

client.on("error", function (err) {
	console.log("Error " + err);
});

app.listen(3000);

io.set('log level', 1);


// handle HTTP requests from clients
function handler (request, response) {
	var pathname = url.parse(request.url).pathname;
	if (pathname == "/") pathname = "index.html";
	var filename = path.join(process.cwd(), pathname);

	fs.exists(filename, function(exists) {
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
			//console.log('Loaded file ' + filename + ' with filetype ' + mime.lookup(filename));
			response.end();
		});
	});
};

// callback function for a new connecting client
io.sockets.on('connection', function (socket) {
	
	// on page load, update user list for new connector
	io.sockets.emit('update_user_list', live_users);

	// put socket in general room
	socket.join('general');

	// attach functions to each connected socket
	handle_message(socket);
	handle_private_message(socket);
	handle_signup(socket);
	handle_login(socket);
	handle_logout(socket);
	handle_add_buddies(socket);
	handle_send_file(socket);

});

function handle_send_file(socket) {
	// I AM GOING TO HAVE TO FUNDAMENTALLY CHANGE THE WAY I HANDLE EVERYTHING. NEED TO HANDLE ROUTES, ETC.
};

function handle_add_buddies(socket) {
	socket.on('addToBuddies', function(buddy, asker) {
		if (socket.user !== buddy) {
			console.log('Attempting to add '+buddy+' to '+socket.user+'\'s Buddy list...');
			client.sismember(socket.user+'_buddies', buddy, function(err, res) {
				if (res) {
					console.log(buddy+' is already in Buddy list!!');
				} else {
					io.sockets.clients().forEach(function (socket2) {
						if (socket2.user === buddy) {
							socket2.emit('confirmBuddy', buddy, asker);
						};
					});
				};
			});
		} else {
			console.log(socket.user+' tried to be friends with him/herself... :(');
		};
	});
	socket.on('buddyHasConfirmed', function(response, buddy, asker) {
		console.log('buddy has confirmed with response: '+response+ ' buddy: '+ buddy+' asker: '+ asker);
		if (response === 'yes') {
			client.sadd(socket.user+'_buddies', asker);
			socket.emit('newBuddyAdded', asker);
			console.log('Successfully added '+asker+' to '+socket.user+'\'s Buddy list!!');
			io.sockets.clients().forEach(function (socket2) {
				if (socket2.user === asker) {
					client.sadd(socket2.user+'_buddies', buddy);
					socket2.emit('newBuddyAdded', buddy);
					console.log('Successfully added '+buddy+' to '+socket2.user+'\'s Buddy list!!');
				};
			});
		} else {
			// DO SOMETHING TO NOTIFY ASKER OF DENIAL LATER
		};

	});
};

// message received from client
function handle_message(socket) {
	
	socket.on('send_message', function(message, room) {
		if (message !== '' && socket.user !== undefined) {
			// broadcast message to users in specified room
			console.log('@'+socket.user+' said: '+message+' IN '+room);
			io.sockets.in(room).emit('add_message', '<strong>'+socket.user+'</strong> - '+message+'<br><small>'+Date()+'</small>', room);
			//io.sockets.emit('add_message', '<strong>'+socket.user+'</strong> - '+message+'<br><small>'+Date()+'</small>');
			//io.sockets.in('general').emit('add_message', 'If you can see this you are in gen pop!');
		};
	});
	
};

// message received from client/sender to recipient/recipient
function handle_private_message(socket) {
	socket.on('privateChatSYN', function(recipient, sender) {
		io.sockets.clients().forEach(function (socket2) {
			if (socket2.user === recipient) {
				rooms.push(sender+recipient);
				socket.join(sender+recipient);
				socket2.join(sender+recipient);
				io.sockets.in(sender+recipient).emit('add_message', 'If you can see this you are in '+(sender+recipient)+'!');
				socket.emit('privateChatACK', recipient, sender);
				socket2.emit('privateChatACK', recipient, sender);
			};
		});
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
			console.log('Attempted signup of existing username: ' + user);
			return;
		} else { // create new user
			client.hmset(user, 'username', user, 'password', pass);
			socket.user = user;
			socket.pass = pass;
			live_users.push(user);
			io.sockets.emit('add_message', user + ' has logged in.', 'general');
			io.sockets.emit('update_user_list', live_users);
			socket.emit('allow_chat', socket.user);
			// check for buddies
			// io.sockets.clients().forEach(function (socket) {
				// socket.emit('showBuddies', live_users[i], user);
			// });
			console.log('User: ' + user + ' has signed up.');
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
					io.sockets.emit('add_message', user + ' has logged in.', 'general');
					io.sockets.emit('update_user_list', live_users);
					socket.emit('allow_chat', socket.user);
					// tell buddies you logged in
					io.sockets.clients().forEach(function (socket2) {
						client.sismember(socket2.user+'_buddies', user, function(err, res) {
							if (res) {
								socket2.emit('buddyJoined', user);
								console.log('Your buddy '+user+' joined.');
							};
						});
						client.sismember(user+'_buddies', socket2.user, function(err, res) {
							if (res) {
								socket.emit('buddyIsHere', socket2.user);
								console.log('Checked '+user+'_buddies, and your buddy '+socket2.user+' is here already.');
							};
						});
					});
					console.log('User: ' + user + ' has successfully logged in with password: ' + pass);
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
			io.sockets.emit('add_message', socket.user + ' has logged out', 'general');
			var i = live_users.indexOf(socket.user);
			live_users.splice(i,1);
			io.sockets.emit('update_user_list', live_users);
			// empty from connected users buddy lists
			io.sockets.clients().forEach(function (socket2) {
				client.sismember(socket2.user+'_buddies', socket.user, function(err, res) {
					if (res) {
						socket2.emit('buddyLeft', socket.user);
						console.log('Your buddy '+socket.user+' left.');
					};
				});
			});
			// ALL ROOMS USER WAS IN
			// LEVERAGE THIS TO CLEANUP PRIVATE CHATS USER HAS LEFT!
			console.log(io.sockets.manager.roomClients[socket.id]);
		};
	});
};
