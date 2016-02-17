var global = this;

this.Collection = LoggableClass.extend({
  /**
  * AdWords entities or classic array collection
  * @constructor
  * @param {AdWordsSelector} selector - Any AdWords selector
  * @param {function} callback - (optional) The callback returning each item
  * @param {int} logLevel - (optional) The log level
  */
  init : function () {
    if(_.isObject(arguments[0]) && _.isFunction(arguments[0].toString)
        && arguments[0].toString().indexOf("Selector") != -1)
      var selector = arguments[0];
    else
      var items = arguments[0];

    var callback = arguments[1],
        logLevel = arguments[2];

    this.$ = {
      items : [],
      type : null,
      subCollections : {}
    };

    if(logLevel)
      this.setLogLevel(logLevel);

    // Simple collection from array
    if(items) {
      this.set(_.isFunction(callback) ? _.map(items,callback) : items);
    }
    // AdWords items collection
    else if(selector) {
      var iterator = selector.get();
      var logged = false;
      while (iterator.hasNext()) {
        var item = iterator.next();
        if(!logged) {
          this.setType(item.getEntityType());
          this.log("Fetching "+iterator.totalNumEntities()+" "+this.getType()+"s through a new Collection");
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
    return this.$.items;
  },
  /**
  * Get the collection type
  * @return {array} the items
  */
  getType : function () {
    return this.$.type;
  },
  /**
  * Set the collection type
  * @return this
  */
  setType : function (type) {
    this.$.type = type;
    return this
  },
  /**
  * Pushes a new item in the collection
  * @param {mixed} item - A new item
  * @return this
  */
  push : function (item) {
    this.$.items.push(item);
    return this;
  },
  /**
  * Set the collection items
  * @param {object} items - An array of items
  * @return this
  */
  set : function (items) {
    this.$.items = items
    return this;
  },
  /**
  * Adds properties to each item in the collection
  * @param {object} setters - A key/value object
  * @return this
  */
  addProperties : function (setters) {
    var self = this;

    // Loop first on setters
    // This ensure maximum performance for AdWords API calls
    _.each(setters,function (value,property) {
      self.log("Fetching each "+self.getType()+" "+property);
      _.each(self.get(), function (item,i) {
        self.$.items[i][property] =  _.isFunction(value) ? value(item) : value;
      });
    });

    return this;
  },
  /**
  * Extract a subcollection from every item key value
  * @param {string} key - A key to retrieve
  * @return Collection a new collection
  */
  subCollection : function (key) {
    if(!_(this.$.subCollections).has(key)) {
      var collected = [];

      this.log("Extracting a new subcollection from every "+this.getType()+" "+key);

      this.each(function (item) {
        if(item[key] instanceof Collection)
          item[key].each(function (subItem) {
            subItem.parent = _.constant(item);
            collected.push(subItem);
          })
        else {
          item[key].parent = _.constant(item);
          collected.push(item[key]);
        }
      });

      this.$.subCollections[key] = new Collection(collected)
                                        .setType(this.get()[0][key].getType());
    }
    return this.$.subCollections[key];
  },
  /**
  * Relationships : Link two collections together
  * @param {string} collectionName - An executable function returning a collection
  * @param {string} foreignKey - The key used by the foreign collection
  * @param {string} localKey - (optional) The key used by the local collection
  * @return this
  */
  addRelationship : function (collectionName, foreignKey, localKey) {
    var foreignCollection = global[collectionName](),
        self = this,
        search = {},
        collections = {};

    if(!localKey)
      localKey = "id";

    self.log("Associating "+collectionName+" to each "+self.getType());

    self.each(function (item) {
      item[collectionName] = new Collection().setType(foreignCollection.getType());
      collections[item[localKey]] = item[collectionName];
    });

    foreignCollection.each(function (foreignItem) {
      if(collections[foreignItem[foreignKey]])
        collections[foreignItem[foreignKey]].push(foreignItem);
    });

    return this;
  },
  /**
  * Execute all the deferred subcollections by property
  * This method must be used in association with DeferredCollections.
  * It's best suited when you want a few parent collections
  * and bunch of child collections for each parent.
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

    if(!_.size(deferredCollections))
      throw "No deferred collection to execute.";

    this.log(_.size(deferredCollections)+" deferred collections.");

    // Subcollections as property :: SubProperties wouldn't be assigned in the
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
  * @return {Collection} A new collection containing only triggered items.
  */
  trigger : function (eachCallback) {
    var self = this,
        triggered = {};

    self.each(function (item) {
      var response = eachCallback(item);
      if(!response) return;

      _.each(response,function (returnedItem,action) {
        if(!_(triggered).has(action)) {
          triggered[action] = [];
        }
        triggered[action].push(returnedItem);
      })
    });

    _.chain(triggered).each( _.invoke ).each(function (items, action) {
      self.log(items.length+" "+self.getType()+"s have been "+action+"d");
    });

    return new Collection(triggered).setType(self.getType());
  },
  /**
  * Loop through each item in the collection and follow progression
  * @param {function} callback - A function called for every item.
  * @param {function} eachPercentage - A function called at each percentage.
  * @return this
  */
  progress : function (callback,eachPercentage) {
    var i = 0, logged = [];

    return this.each(function (item) {
      callback(item);
      var perc = Math.floor(100*(i/this.$.items.length));
      if(!logged[perc] || i==this.$.items.length) {
        logged[perc] = true;
        eachPercentage(perc,i,this.$.items.length);
      }
      i++;
    });
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
  * Looks through each value in the collection, returning the first one that passes a truth test (predicate),
  * or undefined if no value passes the test. The function returns as soon as it finds an acceptable element,
  * and doesn't traverse the entire collection.
  * @param {function} callback - A function called for every item.
  * @return {mixed} the found item or undefined
  */
  find : function (callback) {
    return _.find(this.get(),callback);
  },
  /**
  * Looks through each value in the collection, returning an array of all the values that
  * contain all of the key-value pairs listed in properties.
  * @param {object} properties - A key/pair object of properties
  * @return {array} the found items or undefined
  */
  getWhere : function (properties) {
    return _.where(this.get(), properties);
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
  * Number of items in the collection
  * @return {int} The number of items in the collections.
  */
  size : function () {  return _.size(this.get());  },
  /**
  * Returns the values in list without the elements that the truth test (predicate) passes.
  * @param {function} callback - A function filtering every item.
  * @return this
  */
  reject : function (callback) {
    var oldSize = this.size(),
        newSize = this.set( _.reject(this.get(),callback)).size()
        rejectedSize = oldSize-newSize;

    if(rejectedSize)
      this.log(rejectedSize+" items rejected from collection");
    return this;
  },
  /**
  * Export the collection to a new Google Spreadsheet
  * @return Spreadsheet
  */
  toNewGoogleSheet : function() {
    var spreadsheet = new GoogleSheet().setData(this.get());
    return spreadsheet.create.apply(spreadsheet,arguments).get();
  }
});