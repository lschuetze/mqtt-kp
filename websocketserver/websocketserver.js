"use strict";

//use ws library to create a websocket server listening on port 8000
var ws = require('ws').Server;
var wss = new ws({
    host: 'localhost',
    port: 8000
});

//each protocol is capsuled in it's own module, which needs to be required here
var coap = require('./protocols/coap');
var mqtt = require('./protocols/mqtt');


//get's called when a connection is established
wss.on('connection', function(ws) {

    console.log("info: a new user connected");

    //get's called whenever a message from the webclient is received
    ws.on('message', function(message) {
        console.log("info: received message: " + message);

        //each ingoing message get's validated, and the function returns if the message is invalid
        validate(message, function(err, controls) {
            if (err) {
                ws.send("error: can't validate control data: " + err);
                return;
            } else ws.send("info: control data validated successfully: " + JSON.stringify(
                controls));

            //var receive = function(controls, callback) method of each specifc protocol implementation gets called
            //each time a message with the concerning protocol property is received
            switch (controls.protocol) {

                case 'coap':
                    coap.receive(controls, function(err, res) {
                        if (err) ws.send("error: " + err);
                        else ws.send(res);
                    });
                    break;

                case 'mqtt':
                    ws.send("mqtt branch selected");
                    mqtt.receive(controls, function(err, res) {
                        ws.send(res);
                    });
                    break;

                case 'http':
                    http.receive(controls, function(err, res) {
                        ws.send(res);
                    });
                    break;

                case 'dds':
                    dds.receive(controls, function(err, res) {
                        ws.send(res);
                    });
                    break;

                case 'xmpp':
                    xmpp.receive(controls, function(err, res) {
                        ws.send(res);
                    });
                    break;

                case 'amqp':
                    amqp.receive(controls, function(err, res) {
                        ws.send(res);
                    });
                    break;

                default:
                    ws.send("error: your protocol is currently not supported. Sorry :(");
            }
        });

    });
});


/*
 * validate: validates an incoming message
 *
 * param data: has to be valid JSON and have the propertys 'protocol', 'interval', 'method', 'specific'
 * Example:
 *
 * 		{
 *				"protocol": "coap",
 * 				"interval" : 2000,
 * 				"method" : "PULL",
 *				"specific" : {}
 * 		}
 *
 */

var validate = function(data, callback) {

    var validData;
    try {
        validData = JSON.parse(data);
    } catch (e) {
        callback(e, null);
        return;
    }

    if (!(validData.hasOwnProperty('protocol') && validData.hasOwnProperty('interval') &&
        validData.hasOwnProperty('method') && validData.hasOwnProperty('specific'))) {
        callback(new Error('not all required properties found'), null);
    } else callback(null, validData);

};