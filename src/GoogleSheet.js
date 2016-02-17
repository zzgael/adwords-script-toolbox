/**
* SubCollection creates a hierarchy with a simple predicate function
* @constructor
* @param {AdWordsSelector} selector - Any AdWords selector
* @param {function} callback - (optional) The callback returning each item
* @param {int} logLevel - (optional) The log level
*/
this.GoogleSheet = (function () {
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
      };


  return LoggableClass.extend({
    init : function(spreadsheet) {
      this.$ = {
        spreadsheet : spreadsheet || null,
        items : null
      }
    },
    get : function() {
      return this.$.spreadsheet;
    },
    getSheet : function() {
      return this.get().getActiveSheet();
    },
    setSheet : function(sheet) {
      this.get().setActiveSheet(sheet);
      return this;
    },
    setData : function(data) {
      this.$.items = data;
      return this;
    },
    /**
    * Export stored data to a new Google Spreadsheet
    * @param {string} title - (optional) A title for the spreadsheet.
    * @param {object} options - The options for the first sheet.
    *      {
    *         @param {string} title - (optional) A title for the sheet.
    *         @param {array} columns - (optional) Columns & first line.
    *         @param {function} row - A callback returning an array.
    *      }
    * @param {object} options - (optional) Additional sheet options.
    * @return Spreadsheet
    */
    create : function() {
      var args = _.toArray(arguments),
          self = this;

      if(_.isObject(args[0])) {
        var options = args.shift(),
            title = options.title;
      }
      else {
        var title = args.shift() || "",
            options = args.shift() || {};
      }

      if(args.length)
        var supplementarySheets = args;

      self.log("Creating a new spreadsheet in Google Drive");

      self.$.spreadsheet = SpreadsheetApp.create(title+" "+__today());

      if(options.title)
        self.getSheet().setName(options.title);

      self.write(options);

      // Multiple sheets
      if(supplementarySheets) {
        _.each(supplementarySheets,function (options) {
          self.log("Adding a new sheet "+options.title);
          self.setSheet( self.get().insertSheet(options.title) );
          self.write(options);
        });
      }

      self.log("Spreadsheet ready : "+self.get().getUrl());

      return this;
    },
    /*
    *  Export to spreadsheet
    *
    *  Returns a new Spreadsheet
    */
    write : function(options) {
      this.log("Saving data to spreadsheet");

      var sheetData = [],
          items = options.items || this.$.items;

      _.each(items, function (item) {
        var row = options.row(item);
        if(row)
          sheetData.push(row);
      });

      if(!sheetData.length) {
        this.log("No data to save. Aborting.");
        return false;
      }

      var sheet = this.getSheet(),
          cols = options.columns || _.keys(sheetData[0]),
          rows = sheetData.length;

      sheet.getRange(1, 1, 1, cols.length).setValues([cols]);
      sheet.getRange(2, 1, rows, cols.length).setValues(sheetData);

      return this;
    }
  });
})();
