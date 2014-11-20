var coap = function(){

	var URL 	= require('url');
	var request = require('coap').request;
	var Agent 	= require('coap').Agent;

	var url 	= URL.parse('coap://localhost:5683/sensor');
	url.method  = 'GET'; //default value, needs to be changed according to every request
	url.observe = true; //default value, needs to be changed according to every request


	var getPayload = {
		"interval" : ""
 	};



	/*
	 * _receive: takes a controls JSON and a callback function and creates a new CoAP connection
	 * 			 to the CoAP Server. The response(s) of the CoAP Server get passed back to the websocket through the callback function
	 *
	 * param controls: A valid control JSON from the websocketserver
	 *
	 * param callback: takes two parameters: Error and the JSON response
	 *
	 *
	 */

	var _receive = function(controls, callback){

		if(controls.method == 'PUSH') url.observe = true;
		else if(controls.method == 'PULL') url.observe = false;
		else {
			callback(new Error('method not supported'), null);
			return;
		}

		getPayload.interval = controls.interval;


		//-------------------------- Sample implementation -- needs change! --------------------------
		var req = request(url).on('response', function(res) {
			console.log("info: coap: started request");
			res.on('data', function(data){
				var strData = data.toString('utf-8');
				callback(null, strData);
			});
		});

		req.end(JSON.stringify(getPayload));
		process.stdin.pipe(req);
	};

	return {
		receive : _receive
	};
}();

module.exports = coap;