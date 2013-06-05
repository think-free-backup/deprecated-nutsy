		
/* ********************************************************** 
 *
 *  Description : Log module
 *  Author : Christophe Meurice
 *  
 *  (C) Arisnova 2012
 *
 ************************************************************ */

var fs = require('fs');
var logfile;

exports.init = function(path){

	fs.writeFile( path, 'Creating log file on '+ new Date());

	logfile = fs.createWriteStream( path, {'flags': 'a'});
}

exports.write = function(group,message){

    var date = new Date().toISOString().
              replace(/T/, ' ').      // replace T with a space
              replace(/\..+/, '') ;
              
 	//var str = "\033[30m" + date + "\033[0m \033[34m[" + group + "]\033[0m : " + message;
    var str = "[" + date + "][" + group + "] : " + message;
 	console.log(str);

	if (logfile)
		logfile.write(str + '\n');
}

exports.dump = function(name, object){
	console.log("["+name+"] Object dumped : " + JSON.stringify(object) );
}