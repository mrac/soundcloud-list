define([
  // Application.
  "app"
],

function(app) {

  var Playlist = app.module();
  
  
  
  /**
   * Playlist collection.
   * @constructor
   */
  Playlist.Collection = Backbone.Collection.extend({
    initialize: function(models, options) {
    }    
  });

  
  
  /**
   * Playlist item view.
   * @constructor
   */
  Playlist.Views.Item = Backbone.View.extend({
    template: "playlist/item",
    
    tagName: "li",
    
    serialize: function() {
      return {
        model: this.model
      };
    },
    
    events: {
        "click .remove": "removeFromPlaylist",
        "click .moveup": "moveUp",
        "click .movedown": "moveDown"
    },
    
    removeFromPlaylist: function() {
    },
    
    moveUp: function() {
    },
    
    moveDown: function() {
    },
    
    beforeRender: function() {
    }
    
  });
  
  
  
  /**
   * Playlist list view.
   * @constructor
   * @property {Backbone.Collection} options.playlistItems
   */
  Playlist.Views.List = Backbone.View.extend({
    template: "playlist/list",
    
    className: "playlist-container",
    
    serialize: function() {
        return {
            count: this.options.playlistItems.length
        };
    },
    
    initialize: function() {
      this.listenTo(this.options.playlistItems, {
        "reset": this.render,
        "fetch": function() {
        }
      });
    },
    
    beforeRender: function() {
      this.options.playlistItems.each(function(playlistItem) {
        this.insertView("ul", new Playlist.Views.Item({
          model: playlistItem
        }));
      });
    }
    
  });

    

  return Playlist;

});

