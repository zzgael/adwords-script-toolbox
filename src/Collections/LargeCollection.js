var global = this;

this.LargeCollection = Collection.extend(/** @lends LargeCollection.prototype */{

    /**
     * Large collection of AdWords entities ( over 50k )
     * @constructs
     * @param {object} selector - Any AdWords selector
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
            methods: {},
            selector: null,
            callback: null
        };

        if (!_.isFunction(selector)) {
            error("Large collection selector must be a function.");
        }

        var isAdWordsSelector = _.isObject(selector()) && (
                selector().toString().indexOf("Selector") != -1 || _.isFunction(selector().get)
            );

        // AdWords items collection
        if (isAdWordsSelector) {
            var iterator = selector().get();
            var numEntities = iterator.totalNumEntities();
            this.setType(iterator.next().getEntityType());

            if(numEntities < 50000)
                return this._super.apply(this,arguments);
            else {
                this.log("Initialiazing a large collection of " + iterator.totalNumEntities() + " "+this.getType()+"s");
                this.setSelector(selector);
                this.setCallback(callback);
            }
        }
        // Simple collection from array
        else {
            var items = selector;
            this.setType("List");
            this.set(_.isFunction(callback) ? _.map(items, callback) : items);
        }

        return this;
    },

    /**
     * Starts the real collecting, using a field to divide entities fetching
     *
     * @constructs
     * @param {string} fieldName - Any valid AdWords field name for this collection type
     * @param {Collection} foreignCollection - The collection used to divide fetching
     * @param {string} key (optional) - The collection key to retrieve the field value from
     * @param {int} sliceSizeDivider (optional) - The size of each slice
     */
    collectUsing: function(fieldName, foreignCollection, key, sliceSizeDivider) {
        // Having a size means a normal collection has already been instantiated.
        if(this.size())
            return this;

        if(_.isFunction(foreignCollection))
            foreignCollection = foreignCollection();

        var divider = sliceSizeDivider || 5;
        sliceSize = Math.ceil(foreignCollection.size() / divider);
        var _this = this;

        this.log(
            'Filling '+this.getType()+'s large collection by ' +
            'slicing '+foreignCollection.getType()+'s by '+divider
        );

        if(!key && foreignCollection.hasKey('name'))
            key = 'name';

        foreignCollection.shuffle().slice(sliceSize).each(function (slicedCollection, i, everySlice) {
            notice('Starting pluck '+key);
            var list = key ? slicedCollection.pluck(key) : slicedCollection.get();
            notice('Fetching iterator by adding '+list.length+' '+foreignCollection.getType()+'s '+' to the selector');
            var iterator = _this.getSelector()
                                .withCondition(fieldName+' IN ["'+list.join('","')+'"]')
                                .get();
            _this.log(
                "Fetching " + iterator.totalNumEntities() + " " +
                _this.getType() + "s ("+(i+1)+"/"+_.size(everySlice)+")"
            );
            var items = [];
            while (iterator.hasNext()) {
                items.push(_this.callback(iterator.next()));
            }
            _this.set(items);
            notice('Items fetched.');
        });

        return this;
    },

    /**
     * Get the collection selector
     * Large collection selector MUST be a function
     * so we get a new one on every call
     * @return {object} the selector
     */
    getSelector: function () {
        return this.$.selector();
    },
    /**
     * Set the collection selector
     * @return this
     */
    setSelector: function (selector) {
        this.$.selector = selector;
        return this
    },

    /**
     * Call collection callback on an individual item
     * @return {object} a new item
     */
    callback: function (item) {
        return _.isFunction(this.$.callback) ? this.$.callback(item) : item;
    },
    /**
     * Set the collection callback
     * @return this
     */
    setCallback: function (callback) {
        this.$.callback = callback;
        return this
    }
});
