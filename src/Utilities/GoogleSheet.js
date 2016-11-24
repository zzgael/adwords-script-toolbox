this.GoogleSheet = (function () {
    var __today = function () {
        var today = new Date(), parts = {
            dd: today.getDate(),
            mm: today.getMonth() + 1, //January is 0!
            hh: today.getHours(),
            mn: today.getMinutes()
        };
        _.each(parts, function (v, i) {
            if (parts[i] < 10)
                parts[i] = "0" + parts[i];
        });
        return parts.dd + '/' + parts.mm + '/' + today.getFullYear() +
                ' ' + parts.hh + ':' + parts.mn;
    };


    return LoggableClass.extend(/** @lends GoogleSheet.prototype */{
        /**
         * Build a full Google Sheet document using simple options
         * @constructs
         * @param {object} spreadsheet - Any existing Google Spreadsheet object
         */
        init: function (spreadsheet) {
            this.$ = {
                spreadsheet: spreadsheet || null,
                items: null
            }
        },
        get: function () {
            return this.$.spreadsheet;
        },
        getSheet: function () {
            return this.get().getActiveSheet();
        },
        setSheet: function (sheet) {
            this.get().setActiveSheet(sheet);
            return this;
        },
        setData: function (data) {
            this.$.items = data;
            return this;
        },
        /**
         * Export stored data to a new Google Spreadsheet
         * @param {string} title - (optional) A title for the spreadsheet.
         * @param {object} options - The options for the first sheet.
         * @param {object} options - (optional) Additional sheet options.
         * @return Spreadsheet
         */
        create: function () {
            var args = _.toArray(arguments),
                self = this;

            if (_.isObject(args[0])) {
                var options = args.shift(),
                    title = options.title;
            }
            else {
                var title = args.shift() || "",
                    options = args.shift() || {};
            }

            if (args.length)
                var supplementarySheets = args;

            // Has directory in title ?
            if (title.indexOf("/") != -1) {
                var titleParts = title.split("/");
                var directory = titleParts[0];
                title = titleParts[1];
            }

            var finalTitle = title + " " + __today();

            self.log("Creating a new spreadsheet in Google Drive");

            self.$.spreadsheet = SpreadsheetApp.create(finalTitle);

            // Move directory
            if(directory) {
                var folder = DriveApp.getFoldersByName(directory).next();
                var file = DriveApp.getRootFolder().getFilesByName(finalTitle).next();

                folder.addFile(file);
                DriveApp.getRootFolder().removeFile(file);
            }


            // Set current sheet title
            if (options.title) {
                self.getSheet().setName(options.title);
            }

            self.write(options);

            // Multiple sheets
            if (supplementarySheets) {
                _.each(supplementarySheets, function (options) {
                    self.log("Adding a new sheet " + options.title);
                    self.setSheet(self.get().insertSheet(options.title));
                    self.write(options);
                });
            }

            self.log("Spreadsheet ready : " + self.get().getUrl());

            return this;
        },
        /**
         *  Export to spreadsheet
         *  Returns a new Spreadsheet
         *  @param {object} options
         *  @param {GoogleSheet~rowCallback} options.row The callback handling each row
         * @param {string} options.title - (optional) A title for the sheet.
         * @param {array} options.columns - (optional) Columns & first line.
         */
        write: function (options) {
            this.log("Saving data to spreadsheet");

            var sheetData = [],
                items = options.items || this.$.items;

            /**
             * The callback handling each row added to a spreadsheet
             * @callback GoogleSheet~rowCallback
             * @param {mixed} item Each item in the dataset
             * @return {array} A new row to append in the sheet
             */
            _.each(items, function (item) {
                var row = options.row(item);
                if (row)
                    sheetData.push(row);
            });

            if (!sheetData.length) {
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
