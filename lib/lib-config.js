var log = require('./lib-log');

exports.load = function(file){

    var fs = require('fs');

    var data = fs.readFileSync(file);

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