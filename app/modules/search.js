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
      return {
        id: "search_" + this.model.id
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
      var elemId = $(ev.currentTarget).attr("id");
      var id = elemId.replace(/^search_/,"");
      console.log("add track: ", id);
      app.router.go("add", id);
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

