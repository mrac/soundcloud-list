define([
  // Application.
  "app",
  
  // Models.
  "models/track"
],

function(app, Track) {

  /**
   * PlaylistTracks collection.
   * @constructor
   * @event               play
   * @event               playfinish
   * @event               playstop
   * @event               playing
   * @event               playerror
   * @event               pause
   * @event               resume
   * @event               expand
   * @event               moveUp
   * @event               moveDown
   */
  PlaylistTracks = Backbone.Collection.extend({
    model: Track,

    localStorage: new Backbone.LocalStorage("SoundCloud-Playlist"),
    
    comparator: function(track) {
      return track.get("ordinal");
    },
    
    initialize: function() {
      this.on("moveUp", this.moveUp);
      this.on("moveDown", this.moveDown);
    },
    
    /**
     * Fetch track from SoundCloud by track path and add it to the collection.
     */
    addByPath: function(trackPath) {
      SC.get(trackPath, {}, function(track, err) {
        if(!err) {
          if(track) {
            track = new Track(track);
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
            track = new Track(track);
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
      track.trigger("playselect");
      console.log(trackId + " playselect");
      
      // Stop currently playing track.
      var prevTrackId = track.getCurrentTrackId();
      var prevSound = track.getCurrentSound();
      var prevTrack;
      if(prevSound && prevTrackId) {
        prevTrack = thisCollection.getTrackFromId(prevTrackId);
        prevSound.stop();
      }
      
      SC.whenStreamingReady(function() {
        track.trigger("playready");
        console.log(trackId + " playready");
        SC.stream("/tracks/"+trackId, function(sound, err) {
          if(!err) {
            track.trigger("playresolve", trackId, sound);
            console.log(trackId + " playresolve");
            
            // Start new track.
            sound.play({
              onconnect: function() {
                track.trigger("playconnect", trackId);
                console.log(trackId + " playconnect");
              },
              onid3: function() {
                track.trigger("playid3", trackId);
                console.log(trackId + " playid3");
              },
              onload: function(success) {
                track.trigger("playload", trackId, success);
                console.log(trackId + " playload  (success: "+success+")");
              },
              onplay: function() {
                track.trigger("playstart", trackId);
                console.log(trackId + " playstart");
              },
              onpause: function() {
                track.trigger("playpause", trackId);
                console.log(trackId + " playpause");
              },
              onresume: function() {
                track.trigger("playresume", trackId);
                console.log(trackId + " playresume");
              },
              onsuspend: function() {
                track.trigger("playsuspend", trackId);
                console.log(trackId + " playsuspend");
              },
              onstop: function() {
                track.trigger("playstop", trackId);
                console.log(trackId + " playstop");
              },
              onfinish: function() {
                track.trigger("playfinish", trackId);
                console.log(trackId + " playfinish");
              },
              whileplaying: function() {
                track.trigger("playing", trackId, this.position, this.duration);
              },
              whileloading: function() {
                track.trigger("playloading", trackId, this.bytesLoaded, this.bytesTotal);
              }
            });
            if(doPause) {
              sound.pause();
            }
          } else {
            track.trigger("playerror", trackId);
            console.log(trackId + " playerror");
            console.log("Error while trying to stream a track from SoundCloud: ", err);
            alert("Error while trying to stream a track from SoundCloud");
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
      if(Track.currentSound && Track.currentTrackId && (Track.currentTrackId == trackId)) {
        Track.currentSound.resume();
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
      if(Track.currentSound && Track.currentTrackId && (Track.currentTrackId == trackId)) {
        Track.currentSound.pause();
        track = this.getTrackFromId(trackId);
      } else {
        if(track) {
          this.replayById(trackId, doPause);
        } else {
          app.router.navigate("", {trigger: false, replace: true});
        }
      }
    },
    
    /**
     * eventhandler
     */
    moveUp: function(track, trackView) {
      var index = this.indexOf(track);
      var prevTrack;
      var ordinal = track.get("ordinal");
      var prevordinal;
      if(index > 0) {
        prevTrack = this.at(index-1);
        prevordinal = prevTrack.get("ordinal");
        prevTrack.set({ordinal: ordinal, silent:true});
        track.set({ordinal: prevordinal, silent:true});
        track.save({silent: true});
        prevTrack.save({silent: true});
        this.sort({silent: true});
      }
    },
    
    /**
     * eventhandler
     */
    moveDown: function(track, trackView) {
      var index = this.indexOf(track);
      var nextTrack;
      var ordinal = track.get("ordinal");
      var nextordinal;
      if(index < this.models.length - 1) {
        nextTrack = this.at(index+1);
        nextordinal = nextTrack.get("ordinal");
        nextTrack.set({ordinal: ordinal, silent: true});
        track.set({ordinal: nextordinal, silent: true});
        track.save({silent: true});
        nextTrack.save({silent: true});
        this.sort({silent: true});
      }
    },
    
    /**
     * @param {String}            trackId
     * @return {Track}
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


  return PlaylistTracks;

});
