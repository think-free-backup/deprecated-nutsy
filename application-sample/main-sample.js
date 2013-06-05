
var log = require('../lib/lib-log');

// ## Init and socket connection callback
/* ***************************************************************************** */

// ### init
// Params : none
// Init the application

exports.init = function(config){
    
    log.write("Application Init", "Starting application");
}

// ### clientConnected
// Params : socket
// Client connected to socket callback

exports.clientConnected = function(socket){

}

// ### clientDisconnected
// Params : socket
// Client disconnected callback

exports.clientDisconnected = function(socket){
    
}

// ## Login/Logout managment
/* ***************************************************************************** */

// ### login
// Params : user, password
// Login a user
// Return :
// {type : "ssid", body : sessionId} 
// {type : "login-error", body : "User/Password invalid"}

exports.login = function(user,password,device,callback){

}

// ### logout
// Params : session
// Logout a user by his session

exports.logout = function(session){
    
}

// ### name
// Params : params
// Description
// Return :
// {valid : false, message : "Reason
// {valid : true, message : sessions[session].Expiration, session : sessions[session]}"}

exports.isSessionValid = function(session){
    
}
