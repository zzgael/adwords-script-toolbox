/**
* AdWords entities or classic array collection
* @constructor
* @param {AdWordsSelector} selector - Any AdWords selector
* @param {function} callback - (optional) The callback returning each item
* @param {int} logLevel - (optional) The log level
*/
this.Collection = (function () {
  var __today = function () {
        var today = new Date(),parts = {
          dd : today.getDate(),
          mm : today.getMonth()+1, //January is 0!
          hh : today.getHours(),
          mn : today.getMinutes()
        };
        _.each(parts,function (v,i) {
          if(parts[i] < 10)
            parts[i] = "0"+parts[i];
        });
        return parts.dd+'/'+parts.mm+'/'+today.getFullYear() + ' '+parts.hh+':'+parts.mn;
      },
      __progress = function (items,callback,eachPercentage) {
        var i = 0, logged = [];
        _.each(items,function (item) {
          callback(item);
          var perc = Math.floor(100*(i/$items.length));
          if(!logged[perc] || i==$items.length) {
            logged[perc] = true;
            eachPercentage(perc,i,$items.length);
          }
          i++;
        });
      };

  return Class.extend({
    init : function () {
      if(_.isArray(arguments[0]))
        var items = arguments[0];
      else
        var selector = arguments[0]

      var callback = arguments[1],
          logLevel = arguments[2];

      this.$items = {};
      this.$type = null;
      this.$logLevel = _.isUndefined(logLevel) ? 800 : logLevel ;

      this.log("Initializing a new items collection");

      // Simple collection from array
      if(items) {
        this.set(_.isFunction(callback) ? _.map(items,callback) : items);
      }
      // AdWords items collection
      else if(selector){
        var iterator = selector.get();
        var logged = false;
        while (iterator.hasNext()) {
          var item = iterator.next();
          if(!logged) {
            this.$type = item.getEntityType();
            this.log("Fetching "+iterator.totalNumEntities()+" "+this.$type+"s");
            logged = true;
          }
          this.push( _.isFunction(callback) ? callback(item) : item );
        }
      }

      return this;
    },
    /**
    * Get every item in the collection
    * @return {array} the items
    */
    get : function () {
      return this.$items;
    },
    /**
    * Pushes a new item in the collection
    * @param {mixed} item - A new item
    * @return this
    */
    push : function (item) {
      this.$items[_.size(this.$items)] = item;
      return this;
    },
    /**
    * Set the collection items
    * @param {object} setters - A key/value object
    * @return this
    */
    set : function (items) {
      var self = this;

      delete self.$items;

      if(_.isObject(items))
        self.$items = items;
      else {
        self.$items = {};
        _.each(items,function (item) {
            self.push(item);
        });
      }

      return this;
    },
    /**
    * Adds properties to each item in the collection
    * @param {object} setters - A key/value object
    * @return this
    */
    addProperties : function (setters) {
      var self = this;

      _.extend(self.$properties, setters);

      // Loop first on setters
      // This ensure maximum performance for AdWords API calls
      _.each(setters,function (value,property) {
        self.log("Fetching each "+self.$type+" "+property);
        _.each(self.$items, function (item,i) {
          self.$items[i][property] =  _.isFunction(value) ? value(item) : value;
        });
      });

      return this;
    },
    /**
    * Execute all the deferred subcollections by property
    * @param {object} setters - A key/value object
    * @return this
    */
    executeDeferred : function (property) {
      var items = this.pluck(property),
          deferredCollections = [];

      _.each(items, function (item) {
        if(item instanceof DeferredCollection)
          deferredCollections.push(item);
      });

      // Subcollections :: Properties wouldn't be assigned in the
      // optimized order we want. Deferred actions fix this problem.
      do {
        var done = true;
        _.each(deferredCollections,function (deferredCollection) {
          if(deferredCollection.hasDefer()) {
            deferredCollection.unpileDeferred();
            done = false;
          }
        });
      } while (!done)

      return this;
    },
    /**
    * Triggers an action on every collected item.
    * The callback may return an object containing a single key
    * labeled after the desired action and its corresponding item.
    * @param {function} eachCallback - A function applied to every item.
    * @return {object} An object containing items sorted by triggered action.
    */
    trigger : function (eachCallback) {
      var self = this,
          // Only authorized actions for pipe processing
          pipedItems = {
            "pause" : [],
            "enable" : []
          };

      _.each(this.get(),function (item) {
        var response = eachCallback(item);
        if(!response) return;

        _.each(response,function (item,action) {
          pipedItems[action].push(item);
        })
      });

      return _.chain(pipedItems).each( _.invoke ).mapObject(function (items) {
        return items.length;
      }).value();
    },
    /**
    * Loop through each item in the collection
    * @param {function} callback - A function called for every item.
    * @return this
    */
    each : function (callback) {
      _.each(this.get(),callback);
      return this;
    },
    /**
    * Looks through each value in the list, returning the first one that passes a truth test (predicate),
    * or undefined if no value passes the test. The function returns as soon as it finds an acceptable element,
    * and doesn't traverse the entire list.
    * @param {function} callback - A function called for every item.
    * @return {mixed} the found item or undefined
    */
    find : function (callback) {
      return _.find(this.get(),callback);
    },
    /**
    * Extracts a list of items property values.
    * @param {string} key - A string corresponding to a defined property.
    * @return {array} A list of distinct values.
    */
    pluck : function (key) {  return _.pluck(this.get(),key);  },
    /**
    * Extracts a list of unique items property values.
    * @param {string} key - A string corresponding to a defined property.
    * @return {array} A list of distinct values.
    */
    distinct : function (key) {  return _.uniq(this.pluck(key));  },
    /**
    * Returns the values in list without the elements that the truth test (predicate) passes.
    * @param {function} callback - A function filtering every item.
    * @return this
    */
    reject : function (callback) {
      return this.set( _.reject(this.get(),callback) );
    },
    /**
    * Log a message to the console
    * @param {string} msg
    * @return this
    */
    log : function (msg) {
      Logger.log(msg, this.$logLevel);
    },
    toNewGoogleSheet : function() {
      var args = _.toArray(arguments);


      if(_.isString(args[0])) {
        var title = args.shift(),
            options = args.shift();
      }
      else {
        var options = args.shift(),
            title = options.title;
      }

      if(args.length)
        var supplementarySheets = args;

      this.log("Creating a new spreadsheet in Google Drive");

      var spreadsheet = SpreadsheetApp.create(title+" "+__today());

      this.toGoogleSheet(spreadsheet,options);

      // Multiple sheets
      if(supplementarySheets) {
        _.each(supplementarySheets,function (options) {
          spreadsheet.setActiveSheet(
            spreadsheet.insertSheet(options.title)
          );
          this.toGoogleSheet(spreadsheet,options);
        });
      }

      return spreadsheet;
    },
    /*
    *  Export to spreadsheet
    *
    *  Returns a new Spreadsheet
    */
    toGoogleSheet : function(spreadsheet,options) {
      this.log("Collecting export items");

      var sheetData = [];

      _.each(this.get(),function (item) {
        var row = options.row(item);
        if(row)
          sheetData.push(row);
      });

      if(!sheetData.length) {
        this.log("No data to export. Aborting.");
        return false;
      }

      var sheet = spreadsheet.getActiveSheet(),
          rows = sheetData.length;

      if(options.columns) {
        var cols = options.columns.length;
        sheet.getRange(1, 1, 1, cols).setValues([options.columns]);
      }
      else
        var cols = sheetData[0].length;

      sheet.getRange(2, 1, rows, cols).setValues(sheetData);

      this.log("Spreadsheet ready : "+spreadsheet.getUrl());

      return spreadsheet;
    }
  });
})();
