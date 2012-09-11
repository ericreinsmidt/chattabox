// socket to connect to server
var socket = io.connect('http://erics.homeip.net:3000');

// special case to deal with twitter bootstrap's removing of alert element from DOM
$('.alert .close').live("click", function(e) {
    $(this).parent().hide();
});

// user join/leave event received
socket.on('update_user_list', function(data) {
	$('.room_1').html('');
	$.each(data, function(index, value)
	{ 
		$('.room_1').append('<li>'+value+'</li>');
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
socket.on('allow_chat', function() {
	$('#chat-login').hide();
	$('#chat-signup').hide();
	$('#chat-input').show();
	$('#chat_message').focus();
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

// emit to server a signup event
function signup() {
	$('#buttons').hide();
	socket.emit('signup', $('#new_user').val(), $('#new_password').val() );
	$('#new_user').val('');
	$('#new_password').val('');
	$('.alert').hide();
	$('#new_user').focus();
};

// emit to server a login event
function login() {
	$('#buttons').hide();
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

// have chat box resize when window is resized to look asthetically pleasing
function sizeChat() {
	$('.hero-unit').css('height', ($(window).height() * 0.5));
};