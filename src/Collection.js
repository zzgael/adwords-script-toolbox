// Utility for collecting adwords entities
this.Collection = (function () {
  var $items = [],
      $type = null,

      $today = function () {
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

      $progress = function (items,callback,eachPercentage) {
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
    init : function (selector,callback,extraProperties) {
      if(!selector)
        return this;

      Logger.log("Initializing a new items collection");
      var results = [];
      var iterator = selector.get();
      var logged = false;

      while (iterator.hasNext()) {
        var item = iterator.next();
        if(!logged) {
          $type = item.getEntityType();
          Logger.log("Fetching "+iterator.totalNumEntities()+" "+$type+"s");
          logged = true;
        }
        $items.push( _.isFunction(callback) ? callback(item) : item );
      }

      return this;
    },
    // All extra properties will be set in chain ( good practice )
    // This ensure maximum performance while fetching Adwords entities
    withProperties : function (setters) {
      var self = this;

      _.each(setters,function (value,property) {
        Logger.log("Fetching each "+$type+" "+property);
        _.each($items,function (item,i) {
          $items[i][property] =  _.isFunction(value) ? value(item) : value;
        })
      });

      return this;
    },
    get : function () {
      return $items;
    },
    set : function (items) {
      $items = items;
      return this;
    },
    getType : function () {
      return $type;
    },
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
    each : function (callback) {
      _.each(this.get(),callback);
      return this;
    },
    pluck : function (key) {  return _.pluck(this.get(),key);  },
    distinct : function (key) {  return _.uniq(this.pluck(key));  },
    reject : function (callback) {
      return this.set( _.reject(this.get(),callback) );
    },
    toNewGoogleSheet : function(options) {
      Logger.log("Creating a new spreadsheet in Google Drive");
      //var folder = DriveApp.getFolderById(folderId);
      options.id = SpreadsheetApp.create(options.name+" "+$today()).getId();
      //var file = DriveApp.getFileById(tmpId).getName();
      //var newSpreadsheet = file.makeCopy(file, folder);

      //DriveApp.getFileById(tmpId).setTrashed(true);

      /*_.each(editorsEmails,function (email) {
        tmpSpreadsheet.addEditor(email);
      })*/

      return this.toGoogleSheet(options);
    },
    /*
    *  Export to spreadsheet the advised actions on desired ads or keywords, by distant html content value
    *
    *  Returns a new Spreadsheet
    */
    toGoogleSheet : function(options) {
      Logger.log("Collecting export items");

      var sheetData = [];

      _.each(this.get(),function (item) {
        var row = options.row(item);
        if(row)
          sheetData.push(row);// @item = { entity, url, adCount, campaignName, adGroupName }
      });

      if(!sheetData.length) {
        Logger.log("No data to export. Aborting.");
        return false;
      }

      var spreadsheet = SpreadsheetApp.openById(options.id),
          sheet = spreadsheet.getActiveSheet(),
          rows = sheetData.length;

      if(options.columns) {
        var cols = options.columns.length;
        sheet.getRange(1, 1, 1, cols).setValues([options.columns]);
      }
      else
        var cols = sheetData[0].length;

      sheet.getRange(2, 1, rows, cols).setValues(sheetData);

      Logger.log("Spreadsheet ready : "+spreadsheet.getUrl());

      return spreadsheet;
    }
  });
})();
