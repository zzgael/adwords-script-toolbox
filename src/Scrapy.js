// Extremely fast URL Fetch handler with Scrapy
// Request are cached from the previous script execution
this.Scrapy = (function () {
  return LoggableClass.extend({
    init : function (url) {
      if(!url)
        return this;

      var self = this;

      this.$results = [];

      this.url = url;
      Logger.log("Downloading last cached URLs data");
      var request = this.fetch("items.json");
      if(request) {
        var items = JSON.parse(request.getContentText());
        _.each(items, function (item) {
          self.$results[item.url] = item.result;
        });
        Logger.log("Cache Ready ("+items.length+" URLs)");
      }

      return this;
    },
    get : function () {
      return this.$results;
    },
    post : function (payload) {
      Logger.log("Posting "+payload.urls.length+" URLs to parallel cache processing");
      payload.urls = payload.urls.join("!!");

      var response = this.fetch("parse",{
        method : "post",
        payload : payload
      });

      Logger.log("Cache service status : "+response);

      return this;
    },
    find : function (search) {
      return this.get()[search.url];
    },
    fetch : function(args) {
      arguments[0] = this.url+arguments[0]+'?'+_.now();
      return UrlFetchApp.fetch.apply(UrlFetchApp,arguments);
    }
  });
})();
