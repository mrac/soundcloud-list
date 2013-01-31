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
   * @property {String}   query
   * @event               searchstart
   * @event               search
   * @event               searcherror
   */
  Search.Collection = Backbone.Collection.extend({
    model: Playlist.Track,
    
    /**
     * Search tracks in SoundCloud and add them to the collection.
     */
    search: function(searchQuery) {
        var pageSize = 10;
        this.query = searchQuery;
        if(searchQuery) {
          // Fetch soundcloud tracks and update the collection, if query is not empty.
          SC.get('/tracks', { q: searchQuery, limit: pageSize }, function(tracks, err) {
            if(!err) {
              console.log(tracks);
              this.trigger("search");
              this.reset(tracks);
            } else {
              console.log("Error while getting a list of tracks from SoundCloud: ", err);
              this.trigger("searcherror");
              this.reset();
            }
          }.bind(this));
          this.trigger("searchstart");
        } else {
          // Reset the collection, if query is empty.
          this.trigger("searchstart");
          this.trigger("search");
          this.reset();
        }
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
        model: this.model,
        defaultThumbnail: Playlist.Track.defaultThumbnail
      };
    },
    
    events: {
        // Trigger global events to make events bubble up.
        "click .track": function() {
          app.trigger("global:add", this.model);
        },
    }
    
  });
  
  
  
  /**
   * Search list view.
   * @constructor
   * @property {String}   query
   */
  Search.Views.List = Backbone.View.extend({
    template: "search/list",
    
    className: "search-container",
    
    serialize: function() {
        return {
            count: this.collection.length,
            query: this.query
        };
    },
    
    events: {
        // Execute collection methods.
        "click .searchbutton": "goSearch",
        "keydown .searchquery": "enterKey",
        "click .clearbutton": "clearButton"
    },

    initialize: function() {
      // Listen to collection events.
      this.listenTo(this.collection, {
        "reset": function() {
          this.query = this.collection.query;
          this.render();
        },
        "searchstart": function() {
          this.disableSearch();
          this.showSpinner();
          this.emptyInfo();
          this.updateSearchbox(this.collection.query);
        }
      });
    },
    
    /**
     * Insert item sub-views, before rendering the view.
     */
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
    
    showSpinner: function() {
      this.$("ul").html("<img src='"+app.root+"app/img/spinner.gif'>");
    },
    
    emptyInfo: function() {
      this.$(".info").empty();
    },
    
    updateSearchbox: function(query) {
      this.$(".searchquery").val(query);
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
    enterKey: function(ev) {
        if (ev.keyCode === 13) {
            this.goSearch();
        }
    },
    
    /**
     * eventhandler
     */
    clearButton: function() {
      this.$(".searchquery").val("");
      this.goSearch();
    }
    
    
  });

  
  
  return Search;

});

