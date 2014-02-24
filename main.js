
/* *********************************************************** 
 *
 *  Description : This is the main entry point of the
 *                application, it defines the server 
 *                with his endpoints and call the function
 *                'init' of 'app.js' in the 'application' 
 *                directory
 *  Run it with : supervisor main.js (auto reload on changes)
 *                or node main.js
 *  Author : Christophe Meurice
 *
 ************************************************************ */

// # Setting current working directory

process.chdir(__dirname);

// # Application configuration

var config = require('./lib/lib-config').load('/config/config.json');
var api = "0.0.2";

// # Loading modules

var log = require('./lib/lib-log');
var restify = undefined;
var cookies = undefined; 
var soc = undefined;
var nodestatic = undefined;
var application = require('./application/main');
var fs = require("fs");

if (config.use.rest){

    restify = require('restify');
    cookies = require("cookies");
}

if (config.use.socket){

    soc = require("unified.socket/unified.socket.js");
    soc.init(config.use.ssl);

    if (!config.use.socket)
        config.ports.socket = 0;

    if (!config.use.socketIo)
        config.ports.socketIo = 0;
}

if (config.use.static){

    nodestatic = require('node-static');
}
    
var endpointsRest = [];
var endpointsSocket = [];

log.init(config.logFilePath + "/" +  config.server + ".log");

// # Checking endpoints folder

var endpointsPath = ".";

if (fs.existsSync("./application/endpoints")) { 
    
    endpointsPath = "./application";
}

log.write("[Main]", "Loading endpoints from : " + endpointsPath);


// # Exception handling
/* *************************************************************************************************************** */

process.on('uncaughtException', function (err) {

    log.write("Unknow place", "Uncaught exception : " + err);
    console.log(err.stack);

    if (config.processExitOnError)
        process.exit(1);
});


// # Starting application 
/* **************************************************************************************************************** */

application.init(config);
   

// # Loading application endpoints
/* *************************************************************************************************************** */

log.write("Main", "Loading endpoints");

// ## Loading rest endpoints

if (config.use.rest){

    log.write("Main", "Loading rest endpoints");

    fs.readdirSync( endpointsPath + "/endpoints/rest").forEach(function(file) {
        var name = file.split(".js")[0];
        endpointsRest[name] = require(endpointsPath + "/endpoints/rest/" + file);
        log.write("Main", "Loading application module for rest api : " + name);
    });
}

// ## Loading sockets endpoints

if (config.use.socket){

    log.write("Main", "Loading socket endpoints");

    fs.readdirSync(endpointsPath + "/endpoints/socket").forEach(function(file) {
        var name = file.split(".js")[0];
        endpointsSocket[name] = require(endpointsPath + "/endpoints/socket/" + file);
        log.write("Main", "Loading application module for socket api : " + name);
    });
}


// # Servers creation
/* *************************************************************************************************************** */

if (config.use.rest){

    
    // ## Rest server

    log.write("Main", "Creating rest server on port : " + config.ports.rest);

    var server = restify.createServer();
    server.name = config.server + " " + config.version;
    server.use(restify.queryParser({ mapParams: true }));
    server.use(restify.bodyParser());

    // ### Api version

    server.get('/', version);

    // ### Login

    server.get('/session/:function', session);
    server.post('/session/:function', session);
    
    if (config.debug){
        server.get('/debug/:function', debug);
        server.post('/debug/:function', debug);
    }

    // ### Application parts

    server.get('/call/:part/:function', applicationEndpointsRestRespond);
    server.post('/call/:part/:function', applicationEndpointsRestRespond);


    // ### Static

    if (config.use.restifystatic){
        server.get(/\/static\/.*/, restify.serveStatic({
            'directory': endpointsPath + "/endpoints",
            'default': 'index.html'
        }));
    }

    // ### Starting server

    server.listen(config.ports.rest, function() {

            log.write("Main","Rest server " + server.name + ' listening at ' + server.url);
    });
}

if (config.use.socket){


    // ## Sockets
    if (config.use.socketIo)
        log.write("Main", "Creating socket.io server on port : " + config.ports.socketIo);
    if (config.use.socket)
        log.write("Main", "Creating socket server on port : " + config.ports.socket);

    // ### Connection callback

    soc.setConnectionCallback(function(socket){

        application.clientConnected(socket);
    });

    // ### Disconnect callback

    soc.setDisconnectCallback(function(socket){

        application.clientDisconnected(socket);
    });

    // ### Message callback

    soc.setMessageCallback(socketMessageReceived);

    // ### Connecting

    soc.connect(config.ports.socketIo,config.ports.socket);
}

if (config.use.static){

    var fileServer = new(nodestatic.Server)(endpointsPath + "/endpoints/static");

    require('http').createServer(function (request, response) {
        request.addListener('end', function () {
            fileServer.serve(request, response, function (err, result) {
                if (err) { // There was an error serving the file
                    console.log("Error serving " + request.url + " - " + err.message);

                    // Respond to the client
                    response.writeHead(err.status, err.headers);
                    response.end();
                }
            });
        }).resume();
    }).listen(config.ports.static, "0.0.0.0");

    log.write("Main", "File server loaded")
}

// # We define here the main callback for each parts of the application
/* *************************************************************************************************************** */

if (config.use.rest){

    // ## Rest functions
    /* ***************** */

    // ### Send the version of the application

    function version(req, res, next){

        res.charSet('utf-8');

        res.json({server : config.server, version : config.version, api : api});
    }

    // ### Session managment (login/logout/...)

    function session(req, res, next){

        res.charSet('utf-8');

        if (req.params.function == "login"){

            application.login(req.params.user,req.params.password, "browser", function(ssid, message){

                if (ssid !== undefined){

                    var c = new cookies( req, res, null );
                    c.set( "sessionId", ssid.session, {  httpOnly : config.cookiesHttpOnly } );
                    res.json({type :"ok", body : message});
                }
                else{
                    res.json({type :"error", body : message});
                }
            });
        }
        else if (req.params.function == "checkSession"){

            var c = new cookies( req, res, null );

            var sessionValidity = application.isSessionValid(c.get( "sessionId"));

            if (sessionValidity.valid){

                res.json({type : "ok", body : sessionValidity.message});
            }
            else{

                res.json({type : "error", body : sessionValidity.message});
            }
        }
        else if (req.params.function == "logout"){

            var c = new cookies( req, res, null );
            var ssid = c.get("sessionId");

            application.logout(ssid);

            c.set( "sessionId", "logout", {  httpOnly: true } );

            res.json({type : "ok", body : "Session should be removed"});
        }
        else{

            res.json({type : "error", body : "This module/function doesn't exist in the api" + ". Software version : " + config.version});
        }
    }

    // ### Debug module

    function debug(req,res,next) {

        res.charSet('utf-8');

        var module = endpointsRest["debug"];
            
        if (module != undefined){
            var fct = module[req.params.function];
            if (fct != undefined){
                fct(req,res,next);
                return;
            }
        }   
        else{
            log.write("Debug", "Debug not available");
            res.json({type : "error", body : "Debug not available"});
        }   
    }

    // ### Send the response to rest request depending of the endpoint

    function applicationEndpointsRestRespond(req, res, next) {

        res.charSet('utf-8');

        var c = new cookies( req, res, null );

        var sessionValidity = application.isSessionValid(c.get( "sessionId"));

        if (sessionValidity.valid){

            log.write("main::respond", "Got request : " + req.params.part + " - " + req.params.function);

            res.charSet = 'utf-8';

            var module = endpointsRest[req.params.part];
            if (module != undefined){
                var fct = module[req.params.function];
                if (fct != undefined){
                    fct(req,res,next);
                    return;
                }
            }

            // Module / function not found
            res.json({type : "error", body : "This module/function doesn't exist in the api. Call : " + json.body.module + " - " + json.body.function + " - " + json.body.params + ". Software version : " + config.version});        
        }
        else{

            res.json({type : "error", body : session.message});        
        }
    }
}

if (config.use.socket){

    // ## Sockets functions
    /* ******************** */

    // ### Holding socket connection
    function socketMessageReceived(socket,js) {

        try {
            // We ensure that the js received is json

            var json = js;

            try{
                json = JSON.parse(json);
            }
            catch (Ex){}

            // Action type

            if (json.type == "call"){

                if (socket.allowed){

                    try{

                        var module = endpointsSocket[json.body.module];
                        if (module != undefined){
                            var fct = module[json.body.function];
                            if (fct === undefined)
                                fct = module[json.body.fct];

                            if (fct != undefined){
                                fct(socket,json.body.param);
                                return;
                            }
                        }    

                        log.write("Main", "Unknow module / function call");
                        socket.send({type : "error", tid : json.tid, status : "log", body : "This module/function doesn't exist in the api. Call : " + json.body.module + " - " + json.body.function + " - " + json.body.params + ". Software version : " + config.version});    
                    }

                    catch (err){
                        log.write("Main", "Parse failed");
                        log.write("Main",err);
                    }
                }
                else{
                    log.write("Main", "User not allowed -- Call : " + json.body.module + " - " + json.body.function + " - " + json.body.param );
                }
            }

            else if (json.type == "session"){

                var params = json.body.param;

                var fct = json.body.function;
                if (fct === undefined)
                    fct = json.body.fct;

                if (fct == "tryLogin"){

                    application.login(params[0],params[1],params[2],function(ssid, message){

                        if (ssid !== undefined){

                            socket.allowed = true;
                            socket.uuid = ssid.id;
                            socket.ssid = ssid.session;
                        }

                        socket.send(message);
                    });
                }
                else if (fct == "tryValidateSession"){

                    var ssid = params[0];
                    var answer = application.isSessionValid(ssid);

                    if (answer.valid){

                        socket.allowed = true;
                        socket.uuid = answer.session.id;
                        socket.ssid = answer.session.session;
                        socket.send({type : "ssid", body : ssid});
                    }
                    else{

                        socket.send({type : "login-error", body : "Invalid session"});
                    }
                }
                else if (fct == "tryLogout"){

                    log.write("[login::tryLogout]", "User logout : " + params[0]);

                    application.logout(params[0]);

                    socket.allowed = false;
                    socket.closeConnection();
                }
                else{

                    socket.send({type : "login-error", body : "What did you said ?"});
                }
            }

            else{

                log.write("Main", "Message with unknown type received");

                socket.send({type : "error", tid : json.tid, status : "log", body : "Unknow call type received. Call : " + json.body.module + " - " + json.body.function + " - " + json.body.param + ". Software version : " + config.version});
            }    
        }
        catch (err){
            log.write("Main", "Unknown socket error");
            log.write("Main",err);
        }
    }
}
