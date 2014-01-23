		
/* ********************************************************** 
 *
 *  Description : Log module
 *  Author : Christophe Meurice
 *  
 *  (C) Arisnova 2012
 *
 ************************************************************ */

var fs = require('fs');
var socket = require("unified.socket/unified.socket.js");
var logfile;

exports.init = function(path){

	fs.writeFile( path, 'Creating log file on '+ new Date());

	logfile = fs.createWriteStream( path, {'flags': 'a'});
}

exports.write = function(group,message){

    var date = new Date().toISOString().
              replace(/T/, ' ').      // replace T with a space
              replace(/\..+/, '');// + " " + date.getMilliseconds();
              
    var str = "[" + date + "][" + group + "] : " + message;
 	console.log(str);

	if (logfile)
		logfile.write(str + '\n');
}

exports.broadcast = function(group, message){

	exports.write(group, message);

	var date = new Date().toISOString().
	          replace(/T/, ' ').      // replace T with a space
	          replace(/\..+/, '') ;

	socket.broadcast({type : "log", body : {date : date, group : group, message : message} });
}

exports.dump = function(name, object){
	
	console.log("["+name+"] Object dumped : " + JSON.stringify(object) );
}
