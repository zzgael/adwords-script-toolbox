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
    OFF:    Number.MAX_VALUE,
    SEVERE: 1000,
    WARNING:900,
    INFO:   800,
    NOTICE: 700,
    DEBUG:   500,
    ALL: Number.MIN_VALUE
  });

  var level_ = Level.INFO; //set as default. The log level. We log everything this level or greater.
  var startTime = new Date();
  var counter = 0;
  var logs = [];

  /*************************************************************************
  * @private functions
  ********************/

  function prettyTime (date) {
    var parts = {
      mn : date.getMinutes(),
      ss : date.getSeconds()
    };

    _.each(parts,function (v,i) {
      if(parts[i] < 10)
        parts[i] = "0"+parts[i];
    });

    return parts.mn+':'+parts.ss;
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
        info("Log level has been set to " +  getLevel());
        break;
      }
    }
  }

  //logs to spreadsheet
  function logToSheet_(msg) {
    //check for rollover every 100 rows logged during one invocation
    if (counter % 100 === 0) {
      rollLogOver_();
    }
    //sheet_.appendRow([convertUsingDefaultPatternLayout_(msg)]);
    call_(function() {sheet_.appendRow([convertUsingDefaultPatternLayout_(msg)]);});
  }

  // convert message to text string
  function convertUsingDefaultPatternLayout_(msg) {
    return prettyTime(getElapsedTime_()) + " " + msg;
  }

  //Sets the log sheet, creating one if it doesn't exist
  function setLogSheet_(optKey, optSheetName) {
    var sheetName = optSheetName || "Log";
    var ss = (optKey) ? SpreadsheetApp.openById(optKey) : SpreadsheetApp.getActiveSpreadsheet();
    var sheets = call_(function() {return ss.getSheets();});
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName() === sheetName) {
        sheet_ = sheets[i];
        return;
      }
    }
    sheet_ = ss.insertSheet(sheetName, i);
    sheet_.deleteColumns(2,sheet_.getMaxColumns()-1);
    sheet_.getRange(1,1).setValue(SHEET_LOG_HEADER);
    sheet_.setFrozenRows(1);
    sheet_.setColumnWidth(1, SHEET_LOG_CELL_WIDTH);
    info("Log created");
  }

  //gets the time since the start of logging
  function getElapsedTime_(){
    return new Date(new Date() - startTime);
  }

  return {
    Level : Level,
    /*************************************************************************
    * public methods
    *********/

    /**
    * Allows logging to a Google spreadsheet.
    *
    * @param  {String} optKey    The spreadsheet key (optional). Defaults to the active spreadsheet if available.
    * @param  {String} optSheetName The name of the sheet (optional). Defaults to "Log". The sheet is created if needed.
    * @returns {BetterLog} this object, for chaining
    */
    useSpreadsheet : function (optKey, optSheetName) {
      setLogSheet_(optKey, optSheetName);
      sheet_.getRange(1,1).setValue(SHEET_LOG_HEADER); //in case we need to update
      rollLogOver_(); //rollover the log if we need to
      return this;
    }

    /**
    * Logs at the INFO level. INFO is a message level for informational messages.
    * Typically INFO messages will be written to the console or its equivalent. So the INFO level should
    * only be used for reasonably significant messages that will make sense to end users and system administrators.
    *
    * @param  {Object} message    The message to log or an sprintf-like format string (uses Utilities.formatString() internally - see http://www.perlmonks.org/?node_id=20519 as a good reference).
    * @returns {BetterLog} this object, for chaining
    */
    ,log : function (msg,level) {
      counter++;

      var formattedMsg = convertUsingDefaultPatternLayout_(msg);

      if(level && level < level_)
        return false;

      // Don't format if it's an object. Old Logger handles them better
      OldLogger.log(_.isString(msg) ? formattedMsg : msg);


      logs.push(formattedMsg);

      //ss logging
      if (sheet_) {
        logToSheet_(msg);
      }
    }

    /**
    * Sets the new log level
    *
    * @param  {String} logLevel    The new log level e.g. "OFF","SEVERE","WARNING","INFO","CONFIG","FINE","FINER","FINEST" or "ALL".
    * @returns {BetterLog} this object, for chaining
    */
    ,setLevel : function (logLevel) {
      if (typeof logLevel === "string") {
        var logLevel = stringToLevel_(logLevel);
      }
      if (logLevel != getLevel_()) {
        setLevel_(logLevel);
      }
      return this;
    }
    /**
    * Gets the current log level name
    *
    * @returns {String} The name of the current log level e.g. "OFF","SEVERE","WARNING","INFO","CONFIG","FINE","FINER","FINEST" or "ALL".
    */
    ,getLevel : function () {
      return levelToString_(getLevel_());
    }

    ,sendEmail : function (recipient,subject,body,options) {
      var newLine = "\r\n",
          log = logs.join(newLine),
          options = _.extend({
            name : "AdWords Script Bot"
          },options),
          addHtmlBody = function (str) {
            if(!options.htmlBody)
              options.htmlBody = '';
            options.htmlBody += str.replace(/(?:\r\n|\r|\n)/g,'<br>');
          };

      if(_.isArray(body)) {
        var msgs = body, body = '';
        _.each(msgs, function (msg) {
          body += msg + newLine;
        });
      }

      var logBlob = Utilities.newBlob(log, 'text/plain', 'log.txt');

      if(options.attachments)
        options.attachments.push(logBlob);
      else
        options.attachments = [logBlob];

      options.logo && addHtmlBody("<img width='200' src='"+options.logo+"'>"+ newLine+newLine);

      if(options.logo || options.footer)
        addHtmlBody(body);

      options.footer && addHtmlBody( newLine+newLine + options.footer );

      MailApp.sendEmail(recipient, subject, body, _.omit(options, ['logo','footer']));

      Logger.log("Email sent to "+ recipient);
    }
  };
})();
