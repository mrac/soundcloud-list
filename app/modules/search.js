define([
  // Application.
  "app",
  
  // Modules.
  "modules/playlist"
],

function(app, Playlist) {

  var Search = app.module();
  
  
  /**
   * Search collection.
   * @constructor
   */
  Search.Collection = Backbone.Collection.extend({
    initialize: function(models, options) {
    }    
  });

  
  
  /**
   * Search item view.
   * @constructor
   */
  Search.Views.Item = Backbone.View.extend({
    template: "search/item",
    
    tagName: "li",
    
    serialize: function() {
      return {
        model: this.model
      };
    },
    
    events: {
        "click .add": "addToPlaylist"
    },
    
    addToPlaylist: function() {
    },
    
    beforeRender: function() {
    }
    
  });
  
  
  
  /**
   * Search list view.
   * @constructor
   * @property {Backbone.Collection}    options.searchItems
   * @property {Boolean}                used
   * @event                             search
   */
  Search.Views.List = Backbone.View.extend({
    template: "search/list",
    
    className: "search-container",
    
    serialize: function() {
        return {
            count: this.options.searchItems.length,
            used: this.used
        };
    },
    
    events: {
        "click .searchbutton": "search"
    },
    
    initialize: function() {
      this.used = false;
      this.listenTo(this.options.searchItems, {
        "reset": this.render,
        "fetch": function() {
          this.$("ul").parent().html("<img src='app/img/spinner.gif'>");
        }
      });
    },
    
    beforeRender: function() {
      this.options.searchItems.each(function(searchItem) {
        this.insertView("ul", new Search.Views.Item({
          model: searchItem
        }));
      });
    },
    
    search: function() {
        alert("Search");
        this.trigger("search");
    }
    
  });

  
  
  return Search;

});

