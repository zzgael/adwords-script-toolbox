#AdWords Script Toolbox
A simple set of tools designed to enhance the script simplicity and avoid performance leaks.

#Dependencies
- Underscore
- Class.js ( John Resig's ES6 version), for inheritance
- BetterLog.js ( based on the idea of peterherrmann/BetterLog ), a Logger replacement

#Features

##Collector & Collections

Define collectors capable of retrieving AdWords entities as Collections, then add props, methods and relationships.
Chai.js is included for assertions.

Example is in coffeescript.
```coffee

AdsCollection = -> Collector(
    selector: AdWordsApp.ads().withCondition(
        'Status = Enabled'
    )
    key: 'ad'
    props: adGroupId: "AdGroup.Id"
)

AdGroupsCollection = -> Collector(
    selector: withinCampaigns( AdWordsApp.adGroups())
    key: 'adGroup'
    props:
        id : "Id"
        name: "Name"
        isEnabled: (item) ->
            item.adGroup.isEnabled()
    methods:
        pause: (item) ->
            item.adGroup.pause()
        enable: (item) ->
            item.adGroup.enable()
    relations: [
        ['AdsCollection','adGroupId']
    ]
    assertions: [
        ->
            adsItems = this.subCollection("AdCoreAdsCollection").get()
            expect(adsItems).to.be.an("array").with.length.above(0)
    ]
)
```

Here is a complete example of what a native AdWords Script code vs Collector code looks like.


#Usage
For your first build you'll need Node + Gulp.
```
npm install
gulp build
```
A tools.js file will then be created. You can now include your tools in your AdWords script :
```javascript
function main() {
  var src = UrlFetchApp.fetch("https://your-server.com/tools.min.js?"+(new Date/1E3|0)).getContentText();
  // This is needed for AdWords to know which function is used in the script
  // Not providing this line will probably result an error
  (MailApp.sendEmail, SpreadsheetApp.create, DriveApp);
  try {
    eval(src);
  } catch (e) {
    if(typeof StackedError !== "undefined")
      throw new StackedError(e, src, 'zzgael@gmail.com');
    else
      throw new Error(e);
  }
}
```


#Modifying
If you need to modify any of the .js file, just run gulp watch.

#No documentation yet. Work in progress.