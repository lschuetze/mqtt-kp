/*
 * A simple terminal thats enables the user to output data in the webinterface
 * Usage: terminal.log("your log message here");
 * Please notice that for clarity each log message should be prefixed with "info" / "warning" / "error" / "debug" /...
 */

var terminal = function(){

	$(window).on('load', function() {
        $('#console_form').submit(function(event) {
        var data = $('#console_input_data').val();
        $('#console_input_data').val("");
        socket.send(data);
        event.preventDefault();
    });

});

	var _log = function(data) {

		$('#console_content').append(data + "<br />");
		//If someone knows how to do that with jQuery, feel free to replace ;)
		var objDiv = document.getElementById("console_content");
        objDiv.scrollTop = objDiv.scrollHeight;
	};

	return {
		log : _log
	};
}();