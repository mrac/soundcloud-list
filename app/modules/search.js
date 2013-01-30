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
    
    initialize: function(models, options) {
    },
    
    search: function(searchQuery) {
        var pageSize = 10;
        this.query = searchQuery;
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
    }
    
  });

  
  
  /**
   * Search item view.
   * @constructor
   */
  Search.Views.Item = Backbone.View.extend({
    template: "search/item",
    
    tagName: "li",
    
    attributes: function() {
      var prefixedId = Search.Views.Item.plusIdPrefix(this.model.id);
      return {
        id: prefixedId
      };
    },
    
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
    
  },
  
  // Class properties/methods  
  {
    prefix: "search_",
    
    plusIdPrefix: function(id) {
      var prefix = Search.Views.Item.prefix; // this?
      return prefix+id;
    },
    
    minusIdPrefix: function(id) {
      var prefix = Search.Views.Item.prefix; // this?
      return id.replace(new RegExp("^"+prefix), "");
    }
  });
  
  
  
  /**
   * Search list view.
   * @constructor
   */
  Search.Views.List = Backbone.View.extend({
    template: "search/list",
    
    className: "search-container",
    
    defaults: {
      query: ""
    },
    
    serialize: function() {
        return {
            count: this.collection.length,
            query: this.query
        };
    },
    
    events: {
        "click .searchbutton": "goSearch",
        "keydown .searchquery": "enterKey",
        "click .searchlist > li": "goAdd"
    },

    initialize: function() {
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
    goAdd: function(ev) {
      var id = $(ev.currentTarget).attr("id");
      var trackId = Search.Views.Item.minusIdPrefix(id);
      console.log("add track: ", trackId);
      app.router.go("add", trackId);
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

