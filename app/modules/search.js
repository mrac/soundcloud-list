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
   * @event                             searchstart
   * @event                             searchcomplete
   */
  Search.Collection = Backbone.Collection.extend({
    model: Playlist.Track,
    
    initialize: function(models, options) {
    },
    
    search: function(searchQuery) {
        this.query = searchQuery;
        SC.get('/tracks', { q: searchQuery }, function(tracks) {
          console.log(tracks);
          this.trigger("searchcomplete");
          this.reset(tracks);
        }.bind(this));
        this.trigger("searchstart");
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
    
    beforeRender: function() {
    },
    
    /**
     * eventhandler
     */
    addToPlaylist: function() {
    }    
    
  });
  
  
  
  /**
   * Search list view.
   * @constructor
   * @property {Boolean}                used
   * @property {String}                 query
   */
  Search.Views.List = Backbone.View.extend({
    template: "search/list",
    
    className: "search-container",
    
    serialize: function() {
        return {
            count: this.collection.length,
            used: this.used,
            query: this.query
        };
    },
    
    events: {
        "click .searchbutton": "goSearch",
        "keydown .searchquery": "enterKey"
    },

    initialize: function() {
      this.used = false;
      this.listenTo(this.collection, {
        "reset": function() {
          this.query = this.collection.query;
          this.render();
        },
        "searchstart": function() {
          this.disableSearch();
          this.$("ul").html("<img src='"+app.root+"app/img/spinner.gif'>");
        },
        "searchcomplete": function() {
          this.enableSearch();
        }
      });
    },
    
    beforeRender: function() {
      this.collection.each(function(track) {
        this.insertView("ul", new Search.Views.Item({
          model: track
        }));
      }, this);
    },
    
    disableSearch: function() {
        this.$(".searchquery").attr("disabled", "disabled");
        this.$(".searchbutton").attr("disabled", "disabled");
    },
    
    enableSearch: function() {
        this.$(".searchquery").removeAttr("disabled");
        this.$(".searchbutton").removeAttr("disabled");
    },
    
    /**
     * eventhandler
     */
    goSearch: function() {
      this.query = this.$(".searchquery").val();
      app.router.go("search", this.query);
    },
    
    /**
     * eventhandler
     */
    enterKey: function(e) {
        if (e.keyCode === 13) {
            this.goSearch();
        }
    }
    
  });

  
  
  return Search;

});

