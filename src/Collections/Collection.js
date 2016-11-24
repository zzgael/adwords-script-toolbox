var global = this;

this.Collection = LoggableClass.extend(/** @lends Collection.prototype */{

    /**
     * AdWords entities or classic array collection
     * @constructs
     * @param {object} selector - Any AdWords selector or array or object
     * @param {function} callback - (optional) The callback returning each item
     * @param {int} logLevel - (optional) The log level
     */
    init: function (selector, callback, logLevel) {

        callback = _.isString(callback) ? function (item) {
            var ret = {};
            ret[callback] = item;
            return ret;
        } : callback;

        if (logLevel)
            this.setLogLevel(logLevel);

        this.$ = {
            items: [],
            type: null,
            subCollections: {},
            methods: {}
        };

        if (_.isFunction(selector)) {
            selector = selector();
        }

        var isAdWordsSelector = _.isObject(selector) && (
            selector.toString().indexOf("Selector") != -1
        );

        // AdWords items collection
        if (isAdWordsSelector) {
            var iterator = selector.get();

            if(!iterator.hasNext())
                warning("No items found.");

            var logged = false;
            while (iterator.hasNext()) {
                var item = iterator.next();

                if (!logged) {
                    this.setType(item.getEntityType());
                    this.log("Collecting " + iterator.totalNumEntities() + " " + this.getType()+"s");
                    logged = true;
                }
                this.push(_.isFunction(callback) ? callback(item) : item);
            }
        }
        // Simple collection from array
        else if(selector){
            var items = selector;
            this.setType("Item");
            this.set(_.isFunction(callback) ? _.map(items, callback) : items);
        }

        return this;
    },
    /**
     * Get every item in the collection or a specific item
     * @param {int} index - (optional) the index of the item to get
     * @return {array} the items
     */
    get: function (index) {
        return _.isNumber(index) ? this.$.items[index] : this.$.items;
    },
    /**
     * Get the collection type
     * @return {array} the items
     */
    getMethods: function () {
        return this.$.methods;
    },
    /**
     * Get the collection type
     * @return {array} the items
     */
    getType: function () {
        return this.$.type;
    },
    /**
     * Get the string version of the collection
     * @return {array} the items
     */
    toString: function () {
        return this.getType()+"sCollection("+this.size()+")";
    },
    /**
     * Set the collection type
     * @return this
     */
    setType: function (type) {
        this.$.type = type;
        this.name = type;
        return this
    },
    /**
     * Pushes a new item in the collection
     * @param {mixed} item - A new item
     * @return this
     */
    push: function (item) {
        this.$.items.push(item);
        return this;
    },
    /**
     * Set the collection items
     * @param {object} items - An array of items
     * @return this
     */
    set: function (items) {
        this.$.items = items;
        return this;
    },
    /**
     * Adds properties to each item in the collection
     * @param {object} setters - A key/value object
     * @return this
     */
    addProperties: function (setters) {
        var self = this;

        // Loop first on setters
        // This ensure maximum performance for AdWords API calls
        _.each(setters, function (value, property) {
            self.log((_.isFunction(value)?"Fetching":"Initialize")+" each " + self.getType() + " " + property);
            _.each(self.get(), function (item, i) {
                self.$.items[i][property] = _.isFunction(value) ? value.apply(self, [item]) : value;
            });
        });

        return this;
    },
    /**
     * Adds methods to the collection
     * @param {object} methods - A key/value object
     * @return this
     */
    addMethods: function (methods) {
        var self = this;

        _.each(methods, function (method, name) {
            notice("Setting method " + name);
            if(_.isFunction(self[name]))
                warning("Collection."+name+" overriden.");

            self[name] = _.bind(method, self) ;
        });

        this.$.methods = _.extend(this.$.methods, methods);

        return this;
    },
    /**
     * Extract a subcollection from every item key value
     * @param {string} key - A key to retrieve
     * @return Collection a new collection
     */
    subCollection: function (key) {
        if (!_(this.$.subCollections).has(key)) {
            var collected = [];

            this.log("Extracting a subcollection from every " + this.getType() + " " + key);

            if(!this.hasKey(key))
                error("subCollection("+key+") not found. Key does not exists.");

            this.each(function (item) {
                if (item[key] instanceof Collection)
                    item[key].each(function (subItem) {
                        subItem._parent = item;
                        collected.push(subItem);
                    });
                else {
                    item[key]._parent = item;
                    collected.push(item[key]);
                }
            });

            this.$.subCollections[key] = new Collection(collected)
                .setType(this.get()[0][key].getType())
                .addMethods(this.get()[0][key].getMethods());
        }
        return this.$.subCollections[key];
    },
    /**
     * Relationships : Link two collections together
     * @param {function} collectionGetter - An executable function returning a collection
     * @param {string} foreignKey - The key used by the foreign collection
     * @param {string} localKey - (optional) The key used by the local collection
     * @param {string} itemKey - (optional) The key assigned to each item
     * @return this
     */
    addRelationship: function (collectionGetter, foreignKey, localKey, itemKey) {
        var foreignCollection,
            collectionKey,
            self = this,
            collections = {};

        if( _.isFunction(collectionGetter)) {
            foreignCollection = collectionGetter();
            collectionKey = collectionGetter.name;
        }
        else if(_.isString(collectionGetter) ) {
            foreignCollection = global[collectionGetter]();
            collectionKey = collectionGetter;
        }
        else {
            foreignCollection = collectionGetter;
            collectionKey = collectionGetter.name;
        }

        if(itemKey)
            collectionKey = itemKey;

        if (!localKey)
            localKey = "id";

        self.log("Setting relationship " + collectionKey + " on " + self);

        self.each(function (item) {
            item[collectionKey] = new Collection()
                .setType(foreignCollection.getType())
                .addMethods(foreignCollection.getMethods());
            collections[item[localKey]] = item[collectionKey];
        });

        foreignCollection.each(function (foreignItem) {
            if (collections[foreignItem[foreignKey]])
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
    executeDeferred: function (property) {
        var items = this.pluck(property),
            deferredCollections = [];

        _.each(items, function (item) {
            if (item instanceof DeferredCollection)
                deferredCollections.push(item);
        });

        if (!_.size(deferredCollections))
            throw "No deferred collection to execute.";

        this.log(_.size(deferredCollections) + " deferred collections.");

        // Subcollections as property :: SubProperties wouldn't be assigned in the
        // optimized order we want. Deferred actions fix this problem.
        do {
            var done = true;
            _.each(deferredCollections, function (deferredCollection) {
                if (deferredCollection.hasDefer()) {
                    deferredCollection.unpileDeferred();
                    done = false;
                }
            });
        } while (!done);

        return this;
    },
    /**
     * Triggers an action on every collected item.
     * The callback may return an object containing a single key
     * labeled after the desired action and its corresponding item.
     * @param {function} eachCallback - A function applied to every item.
     * @return {Collection} A new collection containing only triggered items.
     */
    trigger: function (eachCallback) {
        var self = this,
            triggered = {};

        self.each(function (item) {
            var response = eachCallback(item);
            if (!response) return;

            _.each(response, function (returnedItem, action) {
                if (!_(triggered).has(action)) {
                    triggered[action] = [];
                }
                triggered[action].push(returnedItem);
            })
        });

        _.chain(triggered).each(_.invoke).each(function (items, action) {
            self.log(items.length + " " + self.getType() + "s have been " + action + "d");
        });

        return new Collection(triggered).setType(self.getType());
    },
    /**
     * Loop through each item in the collection and follow progression
     * @param {function} callback - A function called for every item.
     * @param {function} eachPercentage - A function called at each percentage.
     * @return this
     */
    progress: function (callback, eachPercentage) {
        var i = 0, logged = [];

        return this.each(function (item) {
            callback.apply(this,[item]);
            var perc = Math.floor(100 * (i / this.size()));
            if (!logged[perc] || i == this.size()) {
                logged[perc] = true;
                eachPercentage.apply(this, [perc, i, this.size()]);
            }
            i++;
        });
    },
    /**
     * Loop through each item in the collection
     * @param {function} callback - A function called for every item.
     * @return this
     */
    each: function (callback) {
        _.each(this.get(), callback, this);
        return this;
    },
    /**
     * Loop through each item in the collection and map a new array from results
     * @param {function} callback - A function called for every item.
     * @return this
     */
    map: function (callback) {
        return _.map(this.get(), callback, this);
    },
    /**
     * Looks through each value in the collection, returning the first one that passes a truth test (predicate),
     * or undefined if no value passes the test. The function returns as soon as it finds an acceptable element,
     * and doesn't traverse the entire collection.
     * @param {function} callback - A function called for every item.
     * @return {mixed} the found item or undefined
     */
    find: function (callback) {
        return _.find(this.get(), callback);
    },
    /**
     * Looks through each value in the collection, returning a new collections of all the values that
     * contain all of the key-value pairs listed in properties.
     * @param {object} properties - A key/pair object of properties
     * @return {array} the found items or undefined
     */
    where: function (properties) {
        return this.clone(this.getWhere(properties));
    },
    /**
     * Looks through each value in the collection, returning a new collections of all the values that
     * contain all of the key-value pairs listed in properties.
     * @param {object} properties - A key/pair object of properties
     * @return {array} the found items or undefined
     */
    whereNot: function (properties) {
        return this.clone(this.filter(_.negate(_.matches(properties))));
    },
    /**
     * Looks through each value in the collection, returning an array of all the values that
     * contain all of the key-value pairs listed in properties.
     * @param {object} properties - A key/pair object of properties
     * @return {array} the found items or undefined
     */
    getWhere: function (properties) {
        return _.where(this.get(), properties);
    },
    /**
     * Extracts a list of items property values.
     * @param {string} key - A string corresponding to a defined property.
     * @return {array} A list of distinct values.
     */
    pluck: function (key) {
        return _.pluck(this.get(), key);
    },
    /**
     * Extracts all unique items by distinct provided key
     * @param {string} key - A string corresponding to a defined property
     * @return array - A list of distinct values.
     */
    uniq: function (key) {
        return _.uniq(this.get(), function (item) {
            return item[key];
        });
    },
    /**
     * Extracts a list of unique values, based on key or callback
     * @param {string} key - A string corresponding to a defined property
     * @return array - A list of distinct values.
     */
    distinct: function (key) {
        return _.pluck(this.uniq(key), key)
    },
    /**
     * Dedupe a collection by distinct provided key
     * @param {string} key - A string corresponding to a defined property
     * @return array - A list of distinct values.
     */
    dedupeBy: function (key) {
        var oldSize = this.size();
        this.set(this.uniq(key));
        this.log('Dedupe by '+key+". Removed "+(oldSize-this.size())+" items");
        return this;
    },
    /**
     * Number of items in the collection
     * @return {int} The number of items in the collections.
     */
    size: function () {
        return _.size(this.get());
    },
    /**
     * Filters items that pass the predicate through a new Collection
     * @return {int} The number of items in the collections.
     */
    filter: function (predicate) {
        return this.clone(_.filter(this.get(), predicate, this));
    },
    /**
     * Slice a collection into sub collections of n size
     * @param {int} size - The size of the slicing
     * @param {int} start (optional) - The starting point of the slice
     */
    slice: function (size, start) {
        if(typeof start !== "undefined")
            return this.clone(this.get().slice(start, start + size));

        var collection = this.clone();

        for (var i = 0, l = this.size(); i < l; i += size){
            collection.push(this.clone(this.get().slice(i, i + size)));
        }

        return collection;
    },
    /**
     * Returns the values in list without the elements that the truth test (predicate) passes.
     * @param {function} callback - A function filtering every item.
     * @return this
     */
    reject: function (callback) {
        this.log('Rejecting items');
        var oldSize = this.size(),
            newSize = this.set(_.reject(this.get(), callback)).size();
        rejectedSize = oldSize - newSize;

        if (rejectedSize)
            this.log(rejectedSize + " items rejected from collection");
        return this;
    },
    /**
     * Returns a new collection with the same properties but new data
     */
    clone: function (data) {
        return (new Collection(data))
                .setType(this.getType())
                .addMethods(this.getMethods());
    },
    /**
     * Returns true if the first item in the collection has the key
     */
    hasKey: function (key) {
        return !_.isUndefined(this.get()[0][key]);
    },
    /**
     * Kansas City Shuffle
     */
    shuffle: function () {
        return this.set(_.shuffle(this.get()));
    },
    /**
     * Export the collection to a new Google Spreadsheet
     * @return Spreadsheet
     */
    toNewGoogleSheet: function () {
        var spreadsheet = new GoogleSheet().setData(this.get());
        return spreadsheet.create.apply(spreadsheet, arguments).get();
    },

    /**
     * Send the .toString() of every collection item by email
     * @return Spreadsheet
     */
    sendEmail: function (recipient, subject, body, options) {
        body = [body || ""].concat(this.get());

        return new Mailer(subject, body, options).send(recipient);
    }

});
