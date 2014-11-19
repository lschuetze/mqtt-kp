var mqtt = function()
{
    var mosca = require('mosca');
    var server = new mosca.Server(moscaSettings);

    var moscaSettings = {
	   port: 1883
    };

    server.on('ready', setup);


    function setup() {
	   console.log('MQTT: Mosca server is up and running')
    }

    // fired when a message is published
    server.on('published', function(packet, client) {
        if(client !== undefined) {
    	   var json = '{"action":"published' +
            '","client":'+ JSON.stringify(client.id) +
            ',"topic":'+ JSON.stringify(packet.topic) +
            ',"payload":'+ JSON.stringify(packet.payload) +
            '}';

            wss.broadcast(json);
        }
    });

    // fired when a client connects
    server.on('clientConnected', function(client) {
    	console.log('Client Connected:', client.id);

    	var json = '{"action":"connected","client":' + JSON.stringify(client.id) +'}';
    	//var obj = JSON.parse(json);

    	wss.broadcast(json);
    });

    // fired when a client disconnects
    server.on('clientDisconnected', function(client) {
    	console.log('Client Disconnected:', client.id);

    	var json = '{"action":"disconnected","client":' + JSON.stringify(client.id) +'}';

    	wss.broadcast(json);
    });

    /*
    wss.on('connection', function(ws) {
        ws.on('message', function(message) {
            console.log('received: %s', message);
        });
        ws.send('something');
    });
    */

    var _receive = function(controls, callback) {

    };

    return {
        receive : _receive;
    };
}();

module.exports = mqtt;