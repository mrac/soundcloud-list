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
   * @event               playerror
   * @event               pause
   * @event               resume
   * @event               expand
   * @event               collapse
   */
  Playlist.Track = Backbone.Model.extend({
    
    // Instance members.
    
    defaults: {
      ordinal: "",
      playing: false,
      paused: false,
      expanded: false
    },
    
    initialize: function() {
      if(!this.get("ordinal")) {
        this.set("ordinal", Playlist.Track.getUniqueId());
      }
      
      // Handle local events
      this.on("play", this.playon);
      this.on("pause", this.pause);
      this.on("resume", this.playon);
      this.on("playfinish", this.playoff);
      this.on("playstop", this.playoff);
      this.on("playerror", this.pause);
      this.on("expand", this.expand);
      this.on("collapse", this.collapse);
    },
    
    /**
     * Override clone method to set the unique ordinal.
     */
    clone: function() {
      var ret = Backbone.Model.prototype.clone.apply(this, arguments);
      this.set("ordinal", Playlist.Track.getUniqueId());
      return ret;
    },
    
    /**
     * Return human readable string of duration time.
     */
    duration: function() {
      var ms = this.get("duration");
      var x, seconds, minutes, hours, days;
      var text = "";
      x = ms / 1000;
      seconds = x % 60;
      x /= 60;
      minutes = x % 60;
      x /= 60;
      hours = x % 24;
      x /= 24;
      days = x;
      days = Math.floor(days);
      hours = Math.floor(hours);
      minutes = Math.floor(minutes);
      seconds = Math.floor(seconds);
      if(days) text += " " + days + " d";
      if(hours) text += " " + hours + " h";
      if(minutes) text += " " + minutes + " m";
      if(seconds) text += " " + seconds + " s";
      if(text.length) text = text.substr(1);
      return text;
    },
    
    /**
     * Toggle expand/collapse.
     */
    toggleExpand: function() {
      if(this.get("expanded")) {
        this.trigger("collapse");
      } else {
        this.trigger("expand");
      }
    },
    
    /**
     * eventhandler
     */
    playon: function() {
      this.set("paused", false);
      this.set("playing", true);
    },
    
    /**
     * eventhandler
     */
    pause: function() {
      this.set("playing", false);
      this.set("paused", true);
    },

    /**
     * eventhandler
     */
    playoff: function() {
      this.set("playing", false);
      this.set("paused", false);
    },
    
    /**
     * eventhandler
     */
    expand: function() {
      if(Playlist.Track.currentExpandedTrack) {
        Playlist.Track.currentExpandedTrack.trigger("collapse");
      }
      this.set("expanded", true);
      Playlist.Track.currentExpandedTrack = this;
    },
    
    /**
     * eventhandler
     */
    collapse: function() {
      this.set("expanded", false);
      if(Playlist.Track.currentExpandedTrack === this) {
        Playlist.Track.currentExpandedTrack = null;
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
    * Currently expanded track or null.
    * @type {Playlist.Track}
    */
    currentExpandedTrack: null,
    
    /**
     * Unique id used for ordinal.
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
   * @event               move
   * @event               play
   * @event               playfinish
   * @event               playstop
   * @event               playing
   * @event               playerror
   * @event               pause
   * @event               resume
   * @event               expand
   * @event               collapse
   */
  Playlist.Collection = Backbone.Collection.extend({
    model: Playlist.Track,

    localStorage: new Backbone.LocalStorage("SoundCloud-Playlist"),
    
    comparator: function(track) {
      return track.get("ordinal");
    },
    
    /**
     * Fetch track from SoundCloud by track path and add it to the collection.
     */
    addByPath: function(trackPath) {
      SC.get(trackPath, {}, function(track, err) {
        if(!err) {
          if(track) {
            track = new Playlist.Track(track);
            this.add(track);
            track.save();
          }
        } else {
          console.log("Error while getting a track from SoundCloud: ", err);
          alert("Error while getting a track from SoundCloud");
        }
      }.bind(this));
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
          alert("Error while getting a track from SoundCloud");
        }
      }.bind(this));
    },
    
    /**
     * Replay SoundCloud track by id.
     * @param {String}    trackId
     * @param {Boolean}   doPause
     */
    replayById: function(trackId, doPause) {
      var thisCollection = this;
      var track = this.getTrackFromId(trackId);
      SC.whenStreamingReady(function() {
        SC.stream("/tracks/"+trackId, function(sound, err) {
          if(!err) {
            // Stop currently playing track.
            var prevTrackId = Playlist.Track.currentTrackId;
            var prevSound = Playlist.Track.currentSound;
            var prevTrack;
            if(prevSound && prevTrackId) {
              prevTrack = thisCollection.getTrackFromId(prevTrackId);
              prevSound.stop();
              if(prevTrack) {
                prevTrack.trigger("playstop", trackId);
              }
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
            if(doPause) {
              sound.pause();
              track.trigger("pause", trackId);
            }
          } else {
            console.log("Error while trying to stream a track from SoundCloud: ", err);
            alert("Error while trying to stream a track from SoundCloud");
            track.trigger("playerror", trackId);
          }
        });
      }.bind(this));
    },
    
    /**
     * Play/resume track by id.
     * @param {String} trackId
     */
    playById: function(trackId) {
      var track = this.getTrackFromId(trackId);
      if(Playlist.Track.currentSound && Playlist.Track.currentTrackId && (Playlist.Track.currentTrackId == trackId)) {
        Playlist.Track.currentSound.resume();
        track.trigger("resume", trackId);
      } else {
        if(track) {
          this.replayById(trackId);
        } else {
          app.router.navigate("", {trigger: false, replace: true});
        }
      }
    },
    
    /**
     * Pause/repause track by id.
     * @param {String} trackId
     */
    pauseById: function(trackId) {
      var track = this.getTrackFromId(trackId);
      var doPause = true;
      if(Playlist.Track.currentSound && Playlist.Track.currentTrackId && (Playlist.Track.currentTrackId == trackId)) {
        Playlist.Track.currentSound.pause();
        track = this.getTrackFromId(trackId);
        track.trigger("pause", trackId);
      } else {
        if(track) {
          this.replayById(trackId, doPause);
        } else {
          app.router.navigate("", {trigger: false, replace: true});
        }
      }
    },
    
    /**
     * Clear status of each track.
     */
    clearStatusAll: function() {
      this.each(function(track) {
        track.set({
          playing: false,
          paused: false,
          expanded: false
        }, {
          silent: true
        });
      }, this);
    },
    
    /**
     * Move track up.
     */
    moveUp: function(track) {
      var index = this.indexOf(track);
      var prevTrack;
      var ordinal = track.get("ordinal");
      var prevordinal;
      if(index > 0) {
        prevTrack = this.at(index-1);
        prevordinal = prevTrack.get("ordinal");
        prevTrack.set({ordinal: ordinal});
        track.set({ordinal: prevordinal});
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
      var ordinal = track.get("ordinal");
      var nextordinal;
      if(index < this.models.length - 1) {
        nextTrack = this.at(index+1);
        nextordinal = nextTrack.get("ordinal");
        nextTrack.set({ordinal: ordinal});
        track.set({ordinal: nextordinal});
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
    template: "playlist/playlist_item",
    
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
        "play": this.render,
        "playfinish": this.render,
        "playstop": this.render,
        "playing": this.playing,
        "pause": this.render,
        "resume": this.render,
        "expand": this.render,
        "collapse": this.render
      });
    },
    
    events: {
        "click .info-container": "triggerGlobalPlayPause",
        "click .remove": function(ev) {
          if(app.router.isMobile()) {
            // For mobiles hide item and trigger event
            this.$el.hide();
            this.model.destroy();
          } else {
            // For desktops slide item and trigger event
            this.$el.slideUp(300, function() {
              this.model.destroy();
            }.bind(this));
          }
          ev.stopPropagation();
        },
        "click .moveup": function(ev) {
          this.model.collection.moveUp(this.model);
          ev.stopPropagation();
        },
        "click .movedown": function(ev) {
          this.model.collection.moveDown(this.model);
          ev.stopPropagation();
        },
        "click img.thumbnail": function(ev) {
          this.model.toggleExpand();
          ev.stopPropagation();
        }

    },
    
    /**
     * eventhandler
     */
    triggerGlobalPlayPause: function(ev) {
      var track;
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
      ev.stopPropagation();
    },
    
    /**
     * eventhandler
     */
    playing: function(track, position, duration) {
    }
    
  });  
  
  
  /**
   * ======================================================================================================
   * Playlist list view.
   * @constructor
   */
  Playlist.Views.List = Backbone.View.extend({
    template: "playlist/playlist_list",
    
    className: "playlist",
    
    serialize: function() {
        return {
            count: this.collection.length
        };
    },
    
    initialize: function() {
      // Listen to collection events.
      this.listenTo(this.collection, {
        "reset": this.render,
        "remove": this.render,
        "move": this.render,
        "playfinish": this.goPlayNext
      });
      
      // Listen to global events.
      this.listenTo(app, {
        "global:addtrack": this.addTrack
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
    goPlayNext: function(trackId) {
      var nextTrackId = this.collection.getNextTrackId(trackId);
      app.router.go("play", nextTrackId);
    },
    
    /**
     * eventhandler
     */
    addTrack: function(track) {
      var newTrack = track.clone();
      this.collection.add(newTrack, {at: this.collection.length});
      newTrack.save();
      this.render();
    }

  });

    

  return Playlist;

});

