define([
  // Application.
  "app",
  
  // Modules.
  "modules/playlist"
],

function(app, Playlist) {

  var Search = app.module();
  
  
  /**
   * ======================================================================================================
   * Search collection.
   * @constructor
   * @property {String}   query
   * @event               searchstart
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
              app.trigger("global:searchcomplete", searchQuery);
              this.reset(tracks);
            } else {
              console.log("Error while getting a list of tracks from SoundCloud: ", err);
              alert("Error while getting a list of tracks from SoundCloud");
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
   * ======================================================================================================
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
        "click": "removeTrack"
    },
    
    /**
     * eventhandler
     */
    removeTrack: function(ev) {
      app.trigger("global:addtrack", this.model);
      if(app.router.isMobile()) {
        // For mobiles hide item and trigger event
        this.$el.hide();
        this.model.collection.remove(this.model);
      } else {
        // For desktops slide item and trigger event
        this.$el.slideUp(100, function() {
          this.model.collection.remove(this.model);
        }.bind(this));
      }
      ev.stopPropagation();
    }
    
  });
  
  
  
  /**
   * ======================================================================================================
   * Search list view.
   * @constructor
   * @property {String}   query
   */
  Search.Views.List = Backbone.View.extend({
    template: "search/list",
    
    className: "search-container",
    
    serialize: function() {
        return {
            query: this.query,
            info: this.info
        };
    },
    
    events: {
        // Execute collection methods.
        "click .searchbutton": "goSearch",
        "keydown .searchquery": "keys",
        "click .clearbutton": "clearQuery",
        "keyup .searchquery": "toggleClearButton"
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
        },
        "remove": function() {
          this.updateInfo();
          if(this.info) {
            this.$(".info").removeClass("hidden").text(this.info);
          } else {
            this.$(".info").addClass("hidden");
          }
        }
      });
      
    },
    
    /**
     * Insert item sub-views, before rendering the view.
     */
    beforeRender: function() {
      this.updateInfo();
      this.collection.each(function(track) {
        this.insertView("ul", new Search.Views.Item({
          model: track
        }));
      }, this);
    },
    
    /**
     * Udpate clear button, depending on search query.
     */
    afterRender: function() {
      this.toggleClearButton();
    },
    
    updateInfo: function() {
      if(this.query) {
        if(this.collection.length) {
          this.info = "Choose from "+this.collection.length+" tracks";
        } else {
          this.info = "No tracks to select";
        }
      } else {
        this.info = "";
      }
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
    keys: function(ev) {
      if (ev.keyCode === 13) {
        this.goSearch();
      }
    },
    
    /**
     * eventhandler
     */
    clearQuery: function() {
      this.$(".searchquery").val("");
      this.goSearch();
    },
    
    /**
     * eventhandler
     */
    toggleClearButton: function() {
      var query = this.$('.searchquery').val();
      if(query) {
        this.$('.clearbutton').removeClass("hidden");
      } else {
        this.$('.clearbutton').addClass("hidden");
      }
    }
    
    
  });

  
  
  return Search;

});

