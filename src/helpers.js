chai.config.includeStack = true;
this.expect = chai.expect;

function test (assertion) {
    try {
        assertion.apply(this, arguments);
    } catch(e) {
        throw new Error(e);
    }
}

function log() {
    Logger.log.apply(Logger, arguments);
}

function notice(s) {
    Logger.log("[NOTICE]: "+s,Logger.Level.NOTICE);
}

function info(s) {
    Logger.log("[INFO]: "+s,Logger.Level.INFO);
}

function warning(s) {
    Logger.log("[WARNING]: "+s,Logger.Level.WARNING);
}

function error(s) {
    throw new Error(s);
}

function capitalizeWords(replaced) {
    var words = replaced.split(/[- ]/g);
    for(var i=0;i<words.length;i++) {
        replaced = replaced.replace(words[i], words[i].charAt(0).toUpperCase() + words[i].slice(1).toLowerCase() );
    }
    return replaced;
}

function truncate (string, length, truncation) {
    length = length || 30;
    truncation = _.isUndefined(truncation) ? '...' : truncation;
    return string.length > length ?
    string.slice(0, length - truncation.length) + truncation : String(string);
}
