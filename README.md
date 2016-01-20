#AdWords Script Toolbox
A simple set of tools designed to enhance the script simplicity and avoid performance leaks.

#Libraries used
- Underscore
- Class.js ( John Resig's ES6 version), for inheritance
- BetterLog.js ( based on the idea of peterherrmann/BetterLog ), a Logger replacement

#Utility Classes
- Collection : a complete AdWords entities collector, with Spreadsheet export, and loop optimization
- Scrapy : a very simple but powerful link with Python Scrapy. It's meant to work with zzgael/django-scrapy-automated-crawler and can be adapted to scrap just every single content regexp found for a list of urls given.

#Usage
For your first build you'll need Node + Gulp.
'''
npm install
gulp build
'''
A tools.js file will then be created. You can now include your tools in your AdWords script :
'''javascript
eval(UrlFetchApp.fetch("https://your-server.com/tools.js").getContentText());
      // This syntax is needed in order for AdWords to know which function is used in the script
      // Not providing this line will probably result an error
      (MailApp.sendEmail, SpreadsheetApp.create);
'''


#Modifying
If you need to modify any of the .js file, just run gulp watch.

#No documentation yet. Work in progress.

[logo]: http://www.adquality.fr/paris/assets/images/logo.png "AdQuality"
