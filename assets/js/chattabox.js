// socket to connect to server
var socket = io.connect('http://localhost:3000');

// special case to deal with twitter bootstrap's removing of alert element from DOM
$('.alert .close').live("click", function(e) {
		$(this).parent().hide();
});

// user join/leave event received
socket.on('update_user_list', function(data) {
	$('.gen-pop').html('');
	$.each(data, function(index, value)
	{ 
		$('.gen-pop').append('<li>'+value+'</li>');
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
socket.on('add_message', function(data) {
	$('.hero-unit').append('<p>'+data+'</p>');
	$('.hero-unit').scrollTop($('.hero-unit')[0].scrollHeight);
	//console.log(data);
});

// event received that you have entered either login or signup
socket.on('allow_chat', function(user) {
	$('#myID').html('<h5>logged in as '+user+'</h5>');
	//socket.emit('getBuddies');
	$('#enter_buttons').hide();
	$('#exit_buttons').show();
	$('#chat-login').hide();
	$('#chat-signup').hide();
	$('#chat-input').show();
	$('#chat_message').focus();
});

socket.on('showBuddies', function(user, buddy) {
	if (user === $('#myID').text()) {
		$('.buddies').append('<li>' + buddy + '</li>');
	};
});

socket.on('buddyJoined', function(buddy) {
	$('.buddies').append('<li>' + buddy + '</li>');
	console.log('Your buddy '+buddy+ ' is here.');
});

socket.on('buddyIsHere', function(buddy) {
	$('.buddies').append('<li>' + buddy + '</li>');
	console.log('Your buddy '+buddy+ ' is already here.');
});

socket.on('buddyLeft', function(buddy) {
	$('.buddies li').filter(function() {
		return $.text([this]) === buddy;
	}).remove();
	console.log('Your buddy '+buddy+ ' left.');
});

// add ability to use enter key to enter data from text field
$('#user_name, #password').keyup(function(event) {
	if (event.keyCode == 13) {
		$('#login_button').click();
	};
});

// add ability to use enter key to enter data from text field
$('#new_user, #new_password').keyup(function(event) {
	if (event.keyCode == 13) {
		$('#signup_button').click();
	};
});

function logout() {
	console.log('disconnected from socket!!!!!!');
	socket.emit('disconnect', function() {
		//
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
	socket.emit('send_message', $('#chat_message').val());
	$('#chat_message').val('');
	$('#chat_message').focus();
};

// add user to .buddies on click
$(document).on('click', '.gen-pop li', function() {

	//
	// NEED TO ADD NOT ADDING ON YOUR OWN USERNAME
	//

	socket.emit('addToBuddies', $(this).text());

});

//////
// MIGHT NEED TO MIVE ABOVE BODY IN HTML
//////
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

//////
// MIGHT NEED TO MIVE ABOVE BODY IN HTML
//////
// have chat box resize when window is resized to look asthetically pleasing
function sizeChat() {
	$('.hero-unit').css('height', ($(window).height() * 0.5));
};