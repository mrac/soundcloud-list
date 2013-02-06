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
    addSaveByPath: function(trackPath) {
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
    addSaveById: function(trackId) {
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
