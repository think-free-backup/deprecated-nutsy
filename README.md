NUTSY
=====

Node unified server.

Installation :
--------------

- run : npm install > Will install base dependencies
- create or clone your application to the folder application
- (optional - depend of application) create or clone your endpoints for rest and socket in the folder endpoints

Communication :
---------------

Every communication is of this type in both way of communication :

    {type : "", body : {}}

If the communication is of type "call", you will have :

    - for socket : {type : "call", body : {module : "the js file", function : "the function", param : []}}
    - for rest calls : http://myserver:port/call/module/function?param1=value&param2=value

Endpoint example :
------------------

- Rest (endpoints/rest) :

    File hello.js

        exports.world = function(req,res,next){

            res.json({type : "ok", body : "Hello " + req.params.name});
        }

    call : http://myserver:port/call/hello/world?name=John

    But first you have to login ! :

    call : http://myserver:port/session/:function

        with function :

            - login?user=myuser&password=mypassword (it will call your application login function and crate a cookies if ssid is defined, it will also send the message to the client)
            - checkSession (will read your cookies for the sessionId and call your application isSessionValid function, if the object returned has the boolean valid set to true, it will return "ok" as type + the message from application in the body, if not, it will return "error" + message)
            - logout (will remove the cookies and send {type : "ok", body : "Session should be removed"})


    You also have a debug.js endpoint which doesn't require login (activate debug in the configuration)


- Socket (endpoints/socket) :

    File hello.js :

        exports.world = function(socket, param){ // param are the params passed in your request

            socket.send({type : "call", body : {module : "message", function : "show", param : [param[0]] } });    // Will echo the first param calling your module message, function show in your client
        }

        Your client sent :

            {type : "call", body : {module :"hello", function : "world", param : ["John"]}};


        But first you have to login ! :

            send :

                - {type : "session", body : {function : tryLogin|tryValidateSession|tryLogout, param : ["user", "password", "clientType"] | ["session"] | ["session"]}

            answer :

                - type : “ssid” or “login-error”
                - body : ”ssid” or “message of error”



Client socket :
---------------

    If you implement a socket client (not a websocket) you have to implement the 
    heartbeat mechanism :
    A limited queue of value. When you send an heartbeat you enqueue the value.
    When the server echo that value you remove it from the queue.
    If the queue is full, there is a communication problem. You have to 
    disconnect, reconnect and revalidate session.
    You have to send send a heartbeat each x ms (by default 5000), if you don’t 
    the server will disconnect you.

    To negotiate the server timeout between heartbeat send :
            {type : "HB-negotiation", body : "5000"}
        To send a heartbeat :
            {type : "HB", "body" : " + uuid + "}

        The server echo your heartbeat :
            {type : "HB-ACK", body : uuid}



Todo :
------

- npm install -> run : application/install.sh
- Implement the possibility to defined customs api call from application (other than call)
- Socket logout : use the socket ssid instead of the ssid sent 