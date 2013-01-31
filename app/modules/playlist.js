define([
  // Application.
  "app"
],

function(app) {

  
  var Playlist = app.module();
  
  
  
  /**
   * ======================================================================================================
   * Track model.
   * @constructor
   * @event               move
   * @event               play
   * @event               playfinish
   * @event               playstop
   * @event               playing
   * @event               pause
   * @event               resume
   */
  Playlist.Track = Backbone.Model.extend({
    
    // Instance members.
    
    defaults: {
      customOrder: ""
    },
    
    initialize: function() {
      if(!this.attributes.customOrder) {
        this.attributes.customOrder = Playlist.Track.getUniqueId();
      }
    }
    
  }, {

    // Class members.

    /**
     * Default thumbnail.
     * @type {String}
     */
    defaultThumbnail: app.root + "app/img/orange_white_40-94fc761.png",
    
    /**
     * Currently played track id.
     * @type {String}
     */
    currentTrackId: null,
    
    /**
    * Currently streamed sound.
    * @type {SoundManager2.SMSound}
    */
    currentSound: null,
    
    /**
     * Unique id used for customOrder.
     */
    getUniqueId: (function() {
      var uniqueId = 0;
      return function() {
        return (Date.now() + (uniqueId++)).toString(26);
      };
    })()

  });



  /**
   * ======================================================================================================
   * Playlist collection.
   * @constructor
   * @event               addstart
   * @event               adderror
   * @event               move
   * @event               play
   * @event               playfinish
   * @event               playstop
   * @event               playing
   * @event               pause
   * @event               resume
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
            app.trigger("global:addcomplete", track);
            track.save();
          }
        } else {
          console.log("Error while getting a track from SoundCloud: ", err);
          this.trigger("adderror", trackId);
        }
      }.bind(this));
      
      this.trigger("addstart", trackId);
    },

    /**
     * Remove track from the collection by track id.
     */
    removeById: function(trackId) {
      var track = this.getTrackFromId(trackId);
      if(track) {
        track.destroy();
      }
    },
    
    /**
     * Replay SoundCloud track by id.
     * @param {String} trackId
     */
    replayById: function(trackId) {
      var thisCollection = this;
      var track = this.getTrackFromId(trackId);
      SC.stream("/tracks/"+trackId, function(sound) {
        console.log("sound:", sound);
        console.log("changed track: ", Playlist.Track.currentTrackId, " => ", trackId);
        // Stop currently playing track.
        var prevTrackId = Playlist.Track.currentTrackId;
        var prevSound = Playlist.Track.currentSound;
        var prevTrack;
        if(prevSound && prevTrackId) {
          prevTrack = thisCollection.getTrackFromId(prevTrackId);
          console.log("prevTrack", prevTrack, prevSound);
          prevSound.stop();
          prevTrack.trigger("playstop", trackId);
        }
        // Start new track.
        Playlist.Track.currentSound = sound;
        Playlist.Track.currentTrackId = trackId;
        sound.play({
          onfinish: function() {
            track.trigger("playfinish", trackId);
          },
          whileplaying: function() {
            track.trigger("playing", trackId, this.position, this.duration);
          }
        });
        track.trigger("play", trackId);
      });
    },
    
    /**
     * Play/resume SoundCloud track by id.
     * @param {String} trackId
     */
    playById: function(trackId) {
      if(Playlist.Track.currentTrackId && (Playlist.Track.currentTrackId == trackId)) {
        this.resumeById(trackId);
      } else {
        this.replayById(trackId);
      }
    },
    
    /**
     * Pause the currently playing track by id.
     * @param {String} trackId
     */
    pauseById: function(trackId) {
      var track = this.getTrackFromId(trackId);
      var currentTrackId = Playlist.Track.currentTrackId;
      var currentSound = Playlist.Track.currentSound;
      // Paranoic check, if trackId is current track
      if(currentSound && (trackId == currentTrackId)) {
        // Paranoic check, if currentSound is not paused already
        if(!currentSound.paused) {
          currentSound.pause();
          track.trigger("pause", trackId);
        }
      }
    },
    
    /**
     * Resume the currently paused track by id.
     * @param {String} trackId
     */
    resumeById: function(trackId) {
      var track = this.getTrackFromId(trackId);
      var currentTrackId = Playlist.Track.currentTrackId;
      var currentSound = Playlist.Track.currentSound;
      // Paranoic check, if trackId is current track
      if(currentSound && (trackId == currentTrackId)) {
        // Paranoic check, if currentSound is paused already
        if(currentSound.paused) {
          currentSound.resume();
          track.trigger("resume", trackId);
        }
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
        track.trigger("move", track);
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
        track.trigger("move", track);
      }
    },
    
    /**
     * @param {String}            trackId
     * @return {Playlist.Track}
     */
    getTrackFromId: function(trackId) {
      var trackIdNumber = parseInt(trackId, 10);
      var track = this.get({id: trackIdNumber});
      return track || null;
    },
    
    /**
     * @param {String}            trackId
     * @return {String}           nextTrackId
     */
    getNextTrackId: function(trackId) {
      var track = this.getTrackFromId(trackId);
      var trackIndex = this.indexOf(track);
      var nextTrack;
      var nextTrackId;
      if(trackIndex < this.models.length - 1) {
        nextTrack = this.at(trackIndex+1);
        nextTrackId = String(nextTrack.get("id"));
      } else {
        nextTrackId = null;
      }
      return nextTrackId;
    }
    
  });

  
  
  /**
   * ======================================================================================================
   * Playlist item view.
   * @constructor
   */
  Playlist.Views.Item = Backbone.View.extend({
    template: "playlist/item",
    
    tagName: "li",
    
    serialize: function() {
      return {
        model: this.model,
        defaultThumbnail: Playlist.Track.defaultThumbnail
      };
    },
    
    initialize: function() {
      // Listen to model events.
      this.listenTo(this.model, {
        "play": this.play,
        "playfinish": this.playFinish,
        "playstop": this.playFinish,
        "playing": this.playing,
        "pause": this.pause,
        "resume": this.play
      });
    },
    
    events: {
        // Trigger global events to make events bubble up.
        "click .remove": function(ev) {
          app.trigger("global:remove", this.model);
          ev.stopPropagation();
        },
        "click": function() {
          if(Playlist.Track.currentTrackId == this.model.get("id")) {
            // If clicked the same track..
            if(Playlist.Track.currentSound && Playlist.Track.currentSound.paused) {
              // and it's paused, then play again.
              app.trigger("global:play", this.model);
            } else {
              // otherwise, pause it.
              app.trigger("global:pause", this.model);
            }
          } else {
            // If clicked different track, just play.
            app.trigger("global:play", this.model);
          }
        },
        
        // Execute collection methods.
        "click .moveup": function(ev) {
          this.model.collection.moveUp(this.model);
          ev.stopPropagation();
        },
        "click .movedown": function(ev) {
          this.model.collection.moveDown(this.model);
          ev.stopPropagation();
        }
    },
    
    /**
     * eventhandler
     */
    play: function() {
      this.$('.item').removeClass("paused");
      this.$('.item').addClass("playing");
    },
    
    /**
     * eventhandler
     */
    playFinish: function() {
      this.$('.item').removeClass("paused");
      this.$('.item').removeClass("playing");
    },
    
    /**
     * eventhandler
     */
    pause: function() {
      this.$('.item').removeClass("playing");
      this.$('.item').addClass("paused");
    },
    
    /**
     * eventhandler
     */
    playing: function(track, position, duration) {
    },
    
  });  
  
  
  /**
   * ======================================================================================================
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
        "playfinish": this.playNext,
        "playing": function() {}
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
    },
    
    /**
     * eventhandler
     */
    playNext: function(trackId) {
      var nextTrackId = this.collection.getNextTrackId(trackId);
      app.router.go("play", nextTrackId);
    }

  });

    

  return Playlist;

});

