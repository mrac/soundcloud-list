define([
  // Application.
  "app",
  
  // Models.
  "models/track",
  
  // Collections
  "collections/searchtracks"
  
],

function(app, Track, SearchTracks) {

  var Search = app.module();
  
  /**
   * ======================================================================================================
   * Search item view.
   * @constructor
   */
  Search.Views.Item = Backbone.View.extend({
    template: "search/search_item",
    
    tagName: "li",
    
    serialize: function() {
      return {
        model: this.model,
        defaultThumbnail: Track.defaultThumbnail
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
        this.$el.slideUp(app.router.ANIM_DURATION, function() {
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
   * @event               render
   */
  Search.Views.List = Backbone.View.extend({
    template: "search/search_list",
    
    className: "search",
    
    serialize: function() {
        return {
            query: this.query,
            info: this.info
        };
    },
    
    events: {
        // Execute collection methods.
        "click .searchbutton": "goSearch",
        "keydown .searchquery": "onKeyDown",
        "keyup .searchquery": "onKeyUp",
        "click .clearbutton": "resetSearch",
    },

    initialize: function() {
      // Initialize collection.
      this.collection = new SearchTracks();
      
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
          this.dynamicRenderInfo();
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
      this.trigger("render");
    },

    /**
     */
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
    
    /**
     */
    dynamicRenderInfo: function() {
      if(this.info) {
        this.$(".info").removeClass("hidden").text(this.info);
      } else {
        this.$(".info").addClass("hidden");
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
     * Hide or show the clear button.
     */
    toggleClearButton: function() {
      var query = this.$('.searchquery').val();
      if(query) {
        this.$('.clearbutton').removeClass("hidden");
      } else {
        this.$('.clearbutton').addClass("hidden");
      }
    },
    
    /**
     * Remove all tracks form the collection.
     */
    empty: function() {
      this.collection.reset();
    },
    
    /**
     * Perform search.
     */
    search: function(query) {
      this.collection.search(query);
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
    resetSearch: function() {
      this.$(".searchquery").val("");
      this.$('.clearbutton').addClass("hidden");
      this.goSearch();
      this.$(".searchquery").focus();
    },
    
    /**
     * eventhandler
     */
    onKeyDown: function(ev) {
      // Handle enter key.
      if (ev.keyCode === 13) {
        this.goSearch();
      }
    },
    
    /**
     * eventhandler
     */
    onKeyUp: function() {
      this.toggleClearButton();
    }
    
    
  });

  
  
  return Search;

});

