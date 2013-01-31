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
    defaults: {
      customOrder: ""
    },
    initialize: function() {
      if(!this.attributes.customOrder) {
        this.attributes.customOrder = Playlist.Track.getUniqueId();
      }
    }
  }, {
    // Class methods
    getUniqueId: (function() {
      var uniqueId = 0;
      return function() {
        return (Date.now() + (uniqueId++)).toString(26);
      };
    })()
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

    localStorage: new Backbone.LocalStorage("SoundCloud-Playlist"),
    
    comparator: function(track) {
      return track.get("customOrder");
    },
    
    /**
     * Fetch track from SoundCloud by track id and add it to the collection.
     */
    addById: function(trackId) {
      SC.get('/tracks/'+trackId, {}, function(track, err) {
        if(!err) {
          if(track) {
            track = new Playlist.Track(track);
            this.add(track);
            track.save();
          }
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
      var track = tracks[0];
      if(track) {
        track.destroy();
      }
    },
    
    /**
     * Move track up.
     */
    moveUp: function(track) {
      var index = this.indexOf(track);
      var prevTrack;
      var customOrder = track.get("customOrder");
      var prevCustomOrder;
      if(index > 0) {
        prevTrack = this.at(index-1);
        prevCustomOrder = prevTrack.get("customOrder");
        prevTrack.set({customOrder: customOrder});
        track.set({customOrder: prevCustomOrder});
        track.save();
        prevTrack.save();
        this.sort();
        this.trigger("move");
      }
    },
    
    /**
     * Move track down.
     */
    moveDown: function(track) {
      var index = this.indexOf(track);
      var nextTrack;
      var customOrder = track.get("customOrder");
      var nextCustomOrder;
      if(index < this.models.length - 1) {
        nextTrack = this.at(index+1);
        nextCustomOrder = nextTrack.get("customOrder");
        nextTrack.set({customOrder: customOrder});
        track.set({customOrder: nextCustomOrder});
        track.save();
        nextTrack.save();
        this.sort();
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
     * Insert item sub-views, before rendering the view.
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

