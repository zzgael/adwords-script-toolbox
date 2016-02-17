/**
* Loggable Class
* @constructor
*/
this.LoggableClass = Class.extend({
  /**
  * Log a message to the console
  * @param {string} msg
  * @return this
  */
  log : function (msg) {
    Logger.log(msg, this.$logLevel || Logger.Level.INFO);
    return this;
  },
  /**
  * Log a message to the console
  * @param {string} msg
  * @return this
  */
  setLogLevel : function (level) {
    this.$logLevel = level;
    return this;
  }
});
