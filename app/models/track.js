define([
  // Application.
  "app"
],

function(app) {

  /**
   * Track model.
   * @constructor
   * @event               play
   * @event               pause
   * @event               resume
   * @event               playfinish
   * @event               playstop
   * @event               playerror
   * @event               playing
   */
  var Track = Backbone.Model.extend({
    
    defaults: {
      ordinal: "",
      playing: false,
      paused: false
    },
    
    initialize: function() {
      if(!this.get("ordinal")) {
        this.set("ordinal", Track.getUniqueId());
      }
      
      // Handle local events
      this.on("playresolve", this.setnew);
      this.on("playpause", this.pause);
      this.on("playstart", this.playon);
      this.on("playresume", this.playon);
      this.on("playfinish", this.playoff);
      this.on("playstop", this.playoff);
      this.on("playerror", this.pause);
      this.on("playing", this.playing);
    },
    
    /**
     * Override clone method to set the unique ordinal.
     */
    clone: function() {
      var ret = Backbone.Model.prototype.clone.apply(this, arguments);
      this.set("ordinal", Track.getUniqueId());
      return ret;
    },
    
    /**
     */
    getCurrentTrack: function() {
      return Track.currentTrack;
    },
    
    /**
     */
    getCurrentTrackId: function() {
      return Track.currentTrackId;
    },
    
    /**
     */
    getCurrentSound: function() {
      return Track.currentSound;
    },
    
    /**
     * @private
     */
    _setCurrent: function(trackId, sound) {
      Track.currentTrack = this;
      Track.currentTrackId = trackId;
      Track.currentSound = sound;
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
     * eventhandler
     */
    setnew: function(trackId, sound) {
      if(sound) {
        this._setCurrent(trackId, sound);
      }
    },
    
    /**
     * eventhandler
     */
    playon: function(trackId) {
      this.save({
        playing: true,
        paused: false
      });
    },
    
    /**
     * eventhandler
     */
    pause: function(trackId) {
      this.save({
        playing: false,
        paused: true
      });
    },

    /**
     * eventhandler
     */
    playoff: function(trackId) {
      this.save({
        playing: false,
        paused: false
      });
    },
    
    /**
     * eventhandler
     */
    playing: function(trackId, position, duration) {
    }
    
  }, {

  
  
  
  
    //========== Class members ==========

    /**
     * Currently played track.
     * @type {Track}
     */
    currentTrack: null,
    
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
     * Unique id used for ordinal.
     */
    getUniqueId: (function() {
      var uniqueId = 0;
      return function() {
        return (Date.now() + (uniqueId++)).toString(26);
      };
    })()

  });


  return Track;

});

