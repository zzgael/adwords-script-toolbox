#AdWords Script Toolbox
A simple set of tools designed to enhance the script simplicity and avoid performance leaks.

#Dependencies
- Underscore
- Class.js ( John Resig's ES6 version), for inheritance
- BetterLog.js ( based on the idea of peterherrmann/BetterLog ), a Logger replacement

#Features

##Better debugging

Adwords Script doesn't provide any stack when there's an error. 
Thanks to [error-stack-parser](https://github.com/stacktracejs/error-stack-parser), StackedError.js can display a nice stack, even from a distant eval'd script.
It also sends you an email.
```js
var src = UrlFetchApp.fetch("https://your-server.com/tools.min.js?"+(new Date/1E3|0)).getContentText();
try {
    eval(src);
  } catch (e) {
    throw new StackedError(e, src, 'your@email.com');
  }
```

##Collector & Collections

Define collectors capable of retrieving AdWords entities as Collections, then add props, methods and relationships.
Not only this Model style of class is convenient to write, but it can also save you some headaches. It respects all of the Google  [optimization guidelines](https://developers.google.com/adwords/scripts/docs/best-practices?hl=fr).

This example in coffeescript is an implementation of a scenario : 
- There is a campaign containing AdGroups corresponding to E-commerce products
- Every AdGroup identified in a specific campaign has a XML feed product corresponding
- The AdGroup Name identifies as the ID of the product, given in each feed item
- Stock is also provided
- We want to pause every AdGroup whose product stock is inferior to 3
```coffee
# Defining a Collector with an AdWords Selector automatically makes it an AdWords collection
AdGroupsCollection = -> Collector(
    selector: AdWordsApp.adGroups()
    key: 'adGroup'
    props:
        productId: "Name"
        isEnabled: (item) -> item.adGroup.isEnabled()
    methods:
        getProduct: (item) ->
            item.FeedItemsCollection.get(0)
            
    relations: [
        ['FeedItemsCollection', 'id', 'productId']
    ]
)

# _FEEDS is in an array of XML feeds
# The collector will return an Array collection
FeedsCollection = -> Collector(
    selector: _FEEDS
    init: (feedUrl) ->
        # getFeeditems is a helper methods capable of returning an array from a XML feed URL
        new Collection(getFeedItems feedUrl)
)

# Using underscore we can quickly make a new collection from plucked values
# This collection will contains every feeds items flattened in a one dimension array
FeedItemsCollection = -> Collector(
    selector: _.flatten(
        _.map FeedsCollection(), (feedItemsCollection) -> @get()
    )
    # Chai.js is included for assertions. Useful for debugging, maybe also for production code 
    # than can't run without conditions.
    assertions: [
        -> expect(@get()).to.be.an("array").with.length.above(0)
    ]
)

AdGroupsCollection().each( (adGroupItem) ->
    product = AdGroupsCollection().getProduct(adGroupItem)

    if !product
        notice "No feed item found for ad id " + adGroupItem.productId
        return

    productHasEnoughStock = product.stock > 3
        
    if adGroupItem.isEnabled and !productHasEnoughStock
        adGroupItem.pause()
    else if !adGroupItem.isEnabled and productHasEnoughStock
        adGroupItem.enable()
)
```

##Large Collection

A normal collection but capable of retrieving more than 50k entities.

##GoogleSheet

Fill sheets with ease.

##Mailer

A bit of helping and a bit of templating ( header/footer )

##Scrapy

If you want to plug a Scrapy (Python) instance

#Usage
For your first build you'll need Node + Gulp.
```
npm install
bower install
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
      throw new StackedError(e, src, 'your@email.com');
    else
      throw new Error(e);
  }
}
```


#Modifying
If you need to modify any of the .js file, just run gulp watch.

#No documentation yet. Work in progress.