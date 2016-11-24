var OldLogger = Logger;
// https://raw.githubusercontent.com/peterherrmann/BetterLog/master/Code.gs
this.Logger = (function () {

    /*************************************************************************
     * Globals
     *********/
    var sheet_; //the spreadsheet that is appended to
    var SHEET_MAX_ROWS = 50000; //sheet is cleared and starts again
    var SHEET_LOG_CELL_WIDTH = 1000; //
    var SHEET_LOG_HEADER = 'Message layout: Date Time UTC-Offset MillisecondsSinceInvoked LogLevel Message. Use Ctrl↓ (or Command↓) to jump to the last row';
    var DATE_TIME_LAYOUT = 'yyyy-MM-dd HH:mm:ss:SSS Z'; //http://docs.oracle.com/javase/6/docs/api/java/text/SimpleDateFormat.html

    //ref http://docs.oracle.com/javase/7/docs/api/java/util/logging/Level.html
    this.Level = Object.freeze({
        OFF: Number.MIN_VALUE,
        SEVERE: 1,
        WARNING: 2,
        INFO: 3,
        NOTICE: 4,
        DEBUG: 5,
        ALL: Number.MAX_VALUE
    });

    var level_ = Level.INFO; //set as default. The log level. We log everything this level or inferior.
    var startTime = new Date();
    var counter = 0;
    var logs = [];

    /*************************************************************************
     * @private functions
     ********************/

    function prettyTime(date) {
        var parts = {
            mn: date.getMinutes(),
            ss: date.getSeconds()
        };

        _.each(parts, function (v, i) {
            if (parts[i] < 10)
                parts[i] = "0" + parts[i];
        });

        return parts.mn + ':' + parts.ss;
    }

    // Returns the string as a Level.
    function stringToLevel_(str) {
        for (var name in Level) {
            if (name == str) {
                return Level[name];
            }
        }
    }

    // Returns the Level as a String
    function levelToString_(lvl) {
        for (var name in Level) {
            if (Level[name] == lvl)
                return name;
        }
    }

    //gets the current logging level
    function getLevel_() {
        return level_;
    }

    //sets the current logging level
    function setLevel_(lvl) {
        for (var name in Level) {
            if (Level[name] == lvl) {
                level_ = lvl;
                log("Log level has been set to " + name);
                break;
            }
        }
    }


    // convert message to text string
    function convertUsingDefaultPatternLayout_(msg) {
        return prettyTime(getElapsedTime_()) + " " + msg;
    }

    //gets the time since the start of logging
    function getElapsedTime_() {
        return new Date(new Date() - startTime);
    }

    return {
        Level: Level,
        /*************************************************************************
         * public methods
         *********

         /**
         * Logs at the INFO level. INFO is a message level for informational messages.
         * Typically INFO messages will be written to the console or its equivalent. So the INFO level should
         * only be used for reasonably significant messages that will make sense to end users and system administrators.
         *
         * @param  {Object} msg    The message to log or an sprintf-like format string
         *                         (uses Utilities.formatString() internally).
         * @param {int} level ( optional ) The level
         * @returns {Logger}
         */
        log: function (msg, level) {
            counter++;

            if(_.isUndefined(level))
                level = getLevel_();

            var formattedMsg = convertUsingDefaultPatternLayout_(msg);

            if (!_.isUndefined(msg) && msg.toString() == "[object Arguments]")
                msg = _.map(msg, function (arg) {
                    return arg;
                });

            if (level <= getLevel_())
                // Don't format if it's an object. Old Logger handles them better
                OldLogger.log(_.isString(msg) ? formattedMsg : msg);

            if(level < Logger.Level.NOTICE)
                logs.push(formattedMsg);
        },

        /**
         * Sets the new log level
         *
         * @param  {String} logLevel The new log level
         *                  e.g. "OFF","SEVERE","WARNING","INFO"
         * @returns {BetterLog} this object, for chaining
         */
        setLevel: function (logLevel) {
            if (typeof logLevel === "string") {
                var logLevel = stringToLevel_(logLevel);
            }
            if (logLevel != getLevel_()) {
                setLevel_(logLevel);
            }
            return this;
        },
        /**
         * Gets the current log level name
         *
         * @returns {String} The name of the current log level
         * e.g. "OFF","SEVERE","WARNING","INFO","DEBUG" or "ALL".
         */
        getLevel: function () {
            return levelToString_(getLevel_());
        },

        sendEmail: function (recipient, subject, body, options) {
            var log = logs.join("\r\n");
            var logBlob = Utilities.newBlob(log, 'text/plain', 'log.txt');

            if (options.attachments)
                options.attachments.push(logBlob);
            else
                options.attachments = [logBlob];

            new Mailer(subject, body, options).send(recipient);
        },

        getLog: function () {
            return OldLogger.getLog();
        }
    };
})();
