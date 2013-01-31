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
   * @event               addstart
   * @event               adderror
   * @event               move
   */
  Playlist.Collection = Backbone.Collection.extend({
    model: Playlist.Track,
    
    /**
     * Fetch track from SoundCloud by track id and add it to the collection.
     */
    addById: function(trackId) {
      SC.get('/tracks/'+trackId, {}, function(tracks, err) {
        if(!err) {
          this.add(tracks);
        } else {
          console.log("Error while getting a track from SoundCloud: ", err);
          this.trigger("adderror");
        }
      }.bind(this));
      
      this.trigger("addstart");
    },
    
    /**
     * Remove track from the collection by track id.
     */
    removeById: function(trackId) {
      var trackIdNumber = parseInt(trackId, 10);
      var tracks = this.where({id: trackIdNumber});
      this.remove(tracks);
    },
    
    /**
     * Move track up.
     */
    moveUp: function(model) {
      var index = this.indexOf(model);
      if(index > 0) {
        this.remove(model, {silent: true});
        this.add(model, {at: index-1, silent: true});
        this.trigger("move");
      }
    },
    
    /**
     * Move track down.
     */
    moveDown: function(model) {
      var index = this.indexOf(model);
      if (index < this.models.length) {
        this.remove(model, {silent: true});
        this.add(model, {at: index+1, silent: true});
        this.trigger("move");
      }
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
        // Trigger global events to make events bubble up.
        "click .remove": function() {
          app.trigger("global:remove", this.model);
        },
        
        // Execute collection methods.
        "click .moveup": function() {
          this.model.collection.moveUp(this.model);
        },
        "click .movedown": function() {
          this.model.collection.moveDown(this.model);
        }
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
      // Listen to collection events.
      this.listenTo(this.collection, {
        "reset": this.render,
        "add": this.render,
        "remove": this.render,
        "move": this.render,
        "fetch": function() {
        }
      });
    },

    /**
     * Render item views.
     */
    beforeRender: function() {
      this.collection.each(function(track) {
        this.insertView("ul", new Playlist.Views.Item({
          model: track
        }));
      }, this);
    }
    
  });

    

  return Playlist;

});

