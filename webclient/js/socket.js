/*
 * socket specific file
 * Opens a socket to the websocketserver
 * and outputs all data to the terminal
 */

var socket = function() {

	var _socket = new WebSocket("ws://localhost:8000");

	_socket.onopen = function() {
		console.log("Established a connection: "+_socket.readyState);
	};

	_socket.onmessage = function(msg) {
		terminal.log(msg.data);
	};

	var _send = function(data){
		_socket.send(data);
		terminal.log(data);
	};

	return {
		send : _send
	};

}();