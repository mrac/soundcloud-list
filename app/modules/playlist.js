define([
  // Application.
  "app"
],

function(app) {

  var Playlist = app.module();
  
  
  
  /**
   * Track model.
   * @constructor
   */
  Playlist.Track = Backbone.Model.extend({
  });



  /**
   * Playlist collection.
   * @constructor
   */
  Playlist.Collection = Backbone.Collection.extend({
    model: Playlist.Track,
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
    
    beforeRender: function() {
    },
    
    /**
     * eventhandler
     */
    removeFromPlaylist: function() {
    },
    
    /**
     * eventhandler
     */
    moveUp: function() {
    },
    
    /**
     * eventhandler
     */
    moveDown: function() {
    }    
    
  });
  
  
  
  /**
   * Playlist list view.
   * @constructor
   */
  Playlist.Views.List = Backbone.View.extend({
    template: "playlist/list",
    
    className: "playlist-container",
    
    serialize: function() {
        return {
            count: this.collection.length
        };
    },
    
    initialize: function() {
      this.listenTo(this.collection, {
        "reset": this.render,
        "fetch": function() {
        }
      });
    },
    
    beforeRender: function() {
      this.collection.each(function(track) {
        this.insertView("ul", new Playlist.Views.Item({
          model: track
        }));
      });
    }
    
  });

    

  return Playlist;

});

