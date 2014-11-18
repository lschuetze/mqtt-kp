$(document).ready(function(){
    var wsUri = "ws://localhost:8080/";
    var clients = [];
    var topics = [];

    $("#connect").click(function() {
        startWebSocket();
    });

    $("#disconnect").click(function() {
        closeWebSocket();
    });

    function startWebSocket() {
        websocket = new WebSocket(wsUri);

        websocket.onopen = function(evt) {
            onOpen(evt)
        };

        websocket.onclose = function(evt) {
            onClose(evt)
        };

        websocket.onmessage = function(evt) {
            var data = evt.data;
            onMessage(data);
        };

        websocket.onerror = function(evt) {
            onError(evt)
        };
    }

    function onOpen(evt) {
        writeToScreen("CONNECTED");
        doSend("WebSocket rocks");
    }

    function onClose(evt) {
        writeToScreen("DISCONNECTED");
    }

    function onMessage(data) {
        if(data !== "") {
            var msg = JSON.parse(data);

            switch(msg.action) {
                case "published":
                    addTopic(msg);
                    addValue(msg);
                    break;
                case "connected":
                    //writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.client);
                    addClient(msg);
                    break;
                case "disconnected":

                    break;
            }
        }
        //writeToScreen('<span style="color: blue;">RESPONSE: ' + evt.client +'</span>');
    }

    function onError(evt) {
        writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
    }

    function doSend(message) {
        writeToScreen("SENT: " + message);
        websocket.send(message);
    }

    function addClient(json) {
        $("#clients").append('<li>'+json.client+'</li>');
    }

    function addValue(json) {
        $("#values").append('<li>'+json.payload+'</li>');
    }

    function addTopic(json) {
        if ($.inArray(json.topic, topics) == -1) {
            topics.push(json.topic);
            $("#topics").append("<li>"+json.topic+"</li>")
        }
    }

    function writeToScreen(message) {
        $("#output").append('<li>'+message+'</li>');
    }

    function closeWebSocket() {
        websocket.close();
    }
    //chart.js
});