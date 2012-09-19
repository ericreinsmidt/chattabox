// socket to connect to server
var socket = io.connect('http://localhost:3000');

// special case to deal with twitter bootstrap's removing of alert element from DOM
$('.alert .close').live("click", function(e) {
		$(this).parent().hide();
});

function showModal() {
	$('#info-modal').modal('show');
};

// user join/leave event received
socket.on('update_user_list', function(data) {
	$('#gen-pop').html('');
	$.each(data, function(index, value)
	{ 
		$('#gen-pop').append('<li>'+value+'</li>');
		//console.log(value);
	});
});

// user login error event recieved
socket.on('login_error', function(head, text) {
	$('#alert-head').html(head);
	$('#alert-text').html(text);
	$("#error_div").show();
	$('.alert').show();
	$('#user_name').val('');
	$('#password').val('');
	$('#new_user').val('');
	$('#new_password').val('');
	$('#user_name').focus();
});

// message received from server, so broadcast
socket.on('add_message', function(message, room) { // HANDLE ROOM
	$('#'+room+'_chat').append('<p>'+message+'</p>');
	$('#'+room+'_chat').scrollTop($('#'+room+'_chat')[0].scrollHeight);
	//console.log(data);
});

// event received that you have entered either login or signup
socket.on('allow_chat', function(user) {
	$('#myID').html('<h5>logged in as '+user+'</h5>');
	$('#enter_buttons').hide();
	$('#exit_buttons').show();
	$('#chat-login').hide();
	$('#chat-signup').hide();
	$('#chat-input').show();
	$('#chat_message').focus();
});

// if I am user, add buddy to list
socket.on('showBuddies', function(user, buddy) {
	if (user === $('#myID').text()) {
		$('#buddies').append('<li>' + buddy + '</li>');
	};
});

// add buddy to list after successful addition
socket.on('newBuddyAdded', function(buddy) {
	$('#buddies').append('<li>' + buddy + '</li>');
	console.log(buddy + ' is now your buddy!');
});

// populate buddy list when buddy logs in
socket.on('buddyJoined', function(buddy) {
	$('#buddies').append('<li>' + buddy + '</li>');
	console.log('Your buddy '+buddy+ ' has logged in.');
});

// populate buddy list when you log in
socket.on('buddyIsHere', function(buddy) {
	$('#buddies').append('<li>' + buddy + '</li>');
	console.log('Your buddy '+buddy+ ' is already here.');
});

// remove buddy from list when they logout
socket.on('buddyLeft', function(buddy) {
	$('#buddies li').filter(function() {
		return $.text([this]) === buddy;
	}).remove();
	console.log('Your buddy '+buddy+ ' left.');
});

// add ability to use enter key to enter data from text field
$('#user_name, #password').keydown(function(event) {
	if (event.keyCode == 13) {
		$('#login_button').click();
	};
});

// add ability to use enter key to enter data from text field
$('#new_user, #new_password').keydown(function(event) {
	if (event.keyCode == 13) {
		$('#signup_button').click();
	};
});

// NOT CURRENTLY USED!!!
function logout() {
	console.log('disconnected from socket!!!!!!');
	socket.emit('disconnect', function() {
		// do nothing
	});
	$('#chat-input').hide();
	$('#enter_buttons').show();
	$('#exit_buttons').hide();
};

// emit to server a signup event
function signup() {
	socket.emit('signup', $('#new_user').val(), $('#new_password').val() );
	$('#new_user').val('');
	$('#new_password').val('');
	$('.alert').hide();
	$('#new_user').focus();
};

// emit to server a login event
function login() {
	socket.emit('login', $('#user_name').val(), $('#password').val() );
	console.log('user:' + $('#user_name').val() +'  and pass: '+ $('#password').val());
	$('#user_name').val('');
	$('#password').val('');
	$('.alert').hide();
	$('#user_name').focus();
};

// add ability to use enter key to enter data from text field
$("#chat_message").keyup(function(event){
	if(event.keyCode == 13){
		$("#chat_button").click();
	}
});

// emit message to server to have it broadcast back to other users
function sendMessage() {
	$('#current-room li').each( function() { 
		if($(this).hasClass('glowing')) {
			room = $(this).attr('id');
			socket.emit('send_message', $('#chat_message').val(), room);
		};
	});
	$('#chat_message').val('');
	$('#chat_message').focus();
};

// add user to #buddies on click
$(document).on('click', '#gen-pop li', function() {
	socket.emit('addToBuddies', $(this).text());
});

// start private chat with buddy on click
$(document).on('click', '#buddies li', function() {
	if ($(this).hasClass('glowing')) {
		console.log('Private room already exists!');
	} else {
		console.log('Creating private chat room with ' + $(this).text() + '.');
		// MUST ADD LIMITATION OF NO SPACES IN USERNAME
		socket.emit('privateChatSYN', $(this).text(), $('#myID').text().split(' ').pop());
	};
});

// private chat suuccessfully initiated from server
socket.on('privateChatACK', function(recipient, sender) {
	$('#buddies li').each(function () {
		if ($(this).text() === sender || $(this).text() === recipient) {
			$(this).addClass('glowing');
			$('.hero-unit').addClass('hidden');
			$('#chat_block').append('<div id="' + (sender+recipient) + '_chat" class="hero-unit well"></div>');
			sizeChat();
			$('#current-room li').removeClass('glowing');
			$('#current-room').append('<li id="' + (sender+recipient) + '" class="glowing">' + (sender+'-'+recipient) + '</li>');
			console.log('Acknowledging private chat room between ' + sender + ' and ' + recipient + '.');
		};
	});
});


// NOT CURRENTLY USED!!!
socket.on('private_message', function(data) {
	console.log(data);
});

// on room selction, set active room to glow and hide all but relevant chat window
$(document).on('click', '#current-room li', function() {
	$('#current-room li').removeClass('glowing');
	$(this).addClass('glowing');
	$('.hero-unit').addClass('hidden');
	$('#'+$(this).attr('id')+'_chat').removeClass('hidden');

	console.log($('#'+$(this).attr('id')+'_chat').removeClass('hidden'));
});

// load login/signup based on user choice
function loadInput(e) {
	if (e === 'signup') {
		$('#chat-login').hide();
		$('#chat-signup').show();
		$('#new_user').focus();
	} else {
		$('#chat-signup').hide();
		$('#chat-login').show();
		$('#user_name').focus();
	};
};

// have chat box resize when window is resized to look asthetically pleasing
function sizeChat() {
	$('.hero-unit').css('height', ($(window).height() * 0.5));
};

// function to close alert window when logging in
$('#login').click(function() {
	$('.alert').hide();
});

// function to close alert window when signing up
$('#signup').click(function() {
	$('.alert').hide();
});
