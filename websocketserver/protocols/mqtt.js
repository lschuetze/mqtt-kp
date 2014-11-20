var mqtt = function() {
    var mosca = require('mosca');
    var moscaSettings = {
        port: 1883
    };
    var server = new mosca.Server(moscaSettings);
    server.on('ready', setup);

    var _callback = null;

    function setup() {
        console.log('MQTT: Mosca server is up and running, listing on port ' + moscaSettings.port);
    }

    // fired when a message is published
    server.on('published', function(packet, client) {
        if (client !== undefined) {
            var now = Date.now();
            var str = String.fromCharCode.apply(null, new Uint16Array(packet.payload));
            var res = str.split(';');
            var json_out = {
                protocol: "mqtt",
                sent: res[0],
                received: now,
                data: {
                    temp: res[1],
                    name: client.id
                }
            };

            _callback(null, JSON.stringify(json_out));
        }
    });

    /*
    // fired when a client connects
    server.on('clientConnected ', function(client) {
        console.log('Client Connected: ', client.id);

        var json = ' {"action": "connected","client": ' + JSON.stringify(client.id) + '}';
    });

    // fired when a client disconnects
    server.on('clientDisconnected ', function(client) {
        console.log('Client Disconnected: ', client.id);

        var json = ' {"action": "disconnected","client": ' + JSON.stringify(client.id) + '}';
    });
    */

    /*
     * Receive (controls, callback)
     * controls: JSON format
     * callback(err, data)
     */
    var _receive = function(controls, callback) {
        _callback = callback;
        var message = {
            topic: 'control',
            payload: controls.method.toLowerCase() + ';' + controls.interval + ';',
            qos: 0,
            retain: false
        };
        server.publish(message);
    };

    return {
        receive: _receive
    };
}();

module.exports = mqtt;