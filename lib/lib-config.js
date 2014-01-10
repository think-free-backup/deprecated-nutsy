var log = require('./lib-log');

exports.load = function(file){

    var fs = require('fs');

    var data = fs.readFileSync(process.cwd() + file);

    try {
        config = JSON.parse(data);
        return config;
    }
    catch (err) {
        log.write('There has been an error parsing your JSON : ' + file)
        log.write(err);
        process.exit(-1);
    }
}

exports.write = function(file, json){

    var fs = require('fs');

    fs.writeFileSync(file, json);
}