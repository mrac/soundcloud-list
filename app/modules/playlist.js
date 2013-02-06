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
   * @event               play
   * @event               pause
   * @event               resume
   * @event               playfinish
   * @event               playstop
   * @event               playerror
   * @event               playing
   */
  Playlist.Track = Backbone.Model.extend({
    
    // Instance members.
    
    defaults: {
      ordinal: "",
      playing: false,
      paused: false
    },
    
    initialize: function() {
      if(!this.get("ordinal")) {
        this.set("ordinal", Playlist.Track.getUniqueId());
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
      this.set("ordinal", Playlist.Track.getUniqueId());
      return ret;
    },
    
    /**
     */
    getCurrentTrack: function() {
      return Playlist.Track.currentTrack;
    },
    
    /**
     */
    getCurrentTrackId: function() {
      return Playlist.Track.currentTrackId;
    },
    
    /**
     */
    getCurrentSound: function() {
      return Playlist.Track.currentSound;
    },
    
    /**
     * @private
     */
    _setCurrent: function(trackId, sound) {
      Playlist.Track.currentTrack = this;
      Playlist.Track.currentTrackId = trackId;
      Playlist.Track.currentSound = sound;
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

    // Class members.

    /**
     * Currently played track.
     * @type {Playlist.Track}
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



  /**
   * ======================================================================================================
   * Playlist collection.
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
  Playlist.Collection = Backbone.Collection.extend({
    model: Playlist.Track,

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
      if(Playlist.Track.currentSound && Playlist.Track.currentTrackId && (Playlist.Track.currentTrackId == trackId)) {
        Playlist.Track.currentSound.resume();
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
        model: this.model
      };
    },
    
    initialize: function() {
      this.listenTo(this.model, {
        "change": this.dynamicRender
      });
    },
    
    events: {
        "click .info-container": "triggerGlobalPlayPause",
        "click .buttons": function(ev) {
          // Area around buttons does not trigger click.
          ev.stopPropagation();
        },
        "click .remove": function(ev) {
          if(app.router.isMobile()) {
            // For mobiles hide item and trigger event
            this.$el.hide();
            this.$el.remove();
            this.model.collection.sort();
            this.model.destroy({silent: true});
          } else {
            // For desktops slide item and trigger event
            this.$el.slideUp(app.router.ANIM_DURATION, function() {
              this.$el.remove();
              this.model.collection.sort();
              this.model.destroy({silent: true});
            }.bind(this));
          }
          ev.stopPropagation();
        },
        "click .moveup": function(ev) {
          this.model.collection.trigger("moveUp", this.model, this);
          ev.stopPropagation();
        },
        "click .movedown": function(ev) {
          this.model.collection.trigger("moveDown", this.model, this);
          ev.stopPropagation();
        },
        "click .thumbnail-container": function(ev) {
          var $item = this.$(".item");
          if($item.hasClass("expanded")) {
            $item.removeClass("expanded");
          } else {
            this.model.collection.trigger("expand", this);
          }
          ev.stopPropagation();
        }

    },
    
    /**
     * Before rendering the item view.
     */
    beforeRender: function() {
      //console.log(Date.now() + " - playlist-item view render");
    },
    
    /**
     * eventhandler
     */
    dynamicRender: function(track) {
      var modify;
      if(track) {
        if(typeof track.get !== "function") {
          track.get = function(key) { return this[key] };
          modify = function(key) { return (key in track) };
        } else {
          modify = function(key) { return (key in track.attributes) };
        }
        var $item = this.$('.item');
        if(modify("playing")) $item.toggleClass("playing", track.get("playing"));
        if(modify("paused")) $item.toggleClass("paused", track.get("paused"));
        if(modify("expanded")) $item.toggleClass("expanded", track.get("expanded"));
      }
    },
    
    /**
     * eventhandler
     */
    triggerGlobalPlayPause: function(ev) {
      if(Playlist.Track.currentTrackId == this.model.get("id")) {
        // If clicked the same track..
        if(Playlist.Track.currentSound && Playlist.Track.currentSound.paused) {
          // and it's paused, then play again.
          this.dynamicRender({ playing: true, paused: false });
          app.trigger("global:play", this.model);
        } else {
          // otherwise, pause it.
          this.dynamicRender({ playing: false, paused: true });
          app.trigger("global:pause", this.model);
        }
      } else {
        // If clicked different track, just play.
        app.trigger("global:play", this.model, this);
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
            text: this.text
        };
    },
    
    initialize: function() {
      // Listen to collection events.
      this.listenTo(this.collection, {
        "reset": this.render,
        "remove": this.deleteItem,
        "destroy": this.deleteItem,
        "playfinish": this.goPlayNext,
        "expand": this.collapseAllExpandOne,
        "moveUp": this.moveUp,
        "moveDown": this.moveDown
      });
      
      // Listen to global events.
      this.listenTo(app, {
        "global:addtrack": this.addTrack,
        "global:play": this.markAsPlaying
      });
      
    },

    /**
     * Insert item sub-views, before rendering the view.
     */
    beforeRender: function() {
      //console.log(Date.now() + " - PLAYLIST-LIST VIEW RENDER");
      this.updateText();
      this.collection.each(function(track) {
        this.insertView("ul", new Playlist.Views.Item({
          model: track
        }));
      }, this);
    },
    
    /**
     */
    updateText: function() {
      if(this.collection.length) {
        this.text = this.collection.length + " tracks in your playlist";
      } else {
        this.text = "Your playlist is empty";
      }
    },
    
    /**
     */
    dynamicRenderText: function() {
      this.$(".text").text(this.text || "");
    },
    
    /**
     * eventhandler
     */
    dynamicRender: function(track, trackView) {
      this.dynamicClear(track);
      trackView.dynamicRender(track);
    },

    /**
     * eventhandler
     */
    dynamicClear: function(track) {
      var modify;
      if(typeof track.get !== "function") {
        modify = function(key) { return (key in track) };
      } else {
        modify = function(key) { return (key in track.attributes) };
      }
      if(modify("playing")) this.$(".playing").removeClass("playing");
      if(modify("paused")) this.$(".paused").removeClass("paused");
      if(modify("expanded")) this.$(".expanded").removeClass("expanded");
    },
    
    /**
     * eventhandler
     */
    collapseAllExpandOne: function(trackView) {
      this.dynamicRender({expanded: true}, trackView);
    },

    /**
     * eventhandler
     */
    moveUp: function(track, trackView) {
      var $prev, $actual;
      var topDif, leftDif, widthDif, heightDif;
      var actualZIndex, prevZIndex;
      $actual = trackView.$el;
      $prev = $actual.prev();
        
      // activate button
      $actual.find(".moveup").addClass("active");
      if(trackView.movingActive) clearTimeout(trackView.movingActive);
      this.movingActive = setTimeout(function() {
        $actual.find(".moveup").removeClass("active");
        delete trackView.movingActive;
      }.bind(this), 500);
        
      if($prev.length) {
        if(app.router.isMobile()) {
          $actual.after($prev);
        } else {
          // dynamic effect
          actualZIndex = $actual.css("zIndex");
          prevZIndex = $prev.css("zIndex");
          $actual.css({ position: "relative", zIndex: 101 });
          $prev.css({ position: "relative", zIndex: 100 });
          topDif = $actual.offset().top - $prev.offset().top;
          leftDif = $actual.offset().left - $prev.offset().left;
          heightDif = $actual.height() - $prev.height();
          $prev.animate({ top: topDif + heightDif, left: leftDif + widthDif }, app.router.ANIM_DURATION);
          $actual.animate({ top: -topDif, left: -leftDif }, app.router.ANIM_DURATION, function() {
            $prev.css({ top: 0, left: 0, position: "static", "zIndex": prevZIndex });
            $actual.css({ top: 0, left: 0, position: "static", "zIndex": actualZIndex });
            // static effect
            $actual.after($prev);
          });
        }
      }
    },
    
    /**
     * eventhandler
     */
    moveDown: function(track, trackView) {
      var $next, $actual;
      var topDif, leftDif, widthDif, heightDif;
      var actualZIndex, nextZIndex;
      $actual = trackView.$el;
      $next = $actual.next();
      
        // activate button
        $actual.find(".movedown").addClass("active");
        if(trackView.movingActive) clearTimeout(trackView.movingActive);
        this.movingActive = setTimeout(function() {
          $actual.find(".movedown").removeClass("active");
          delete trackView.movingActive;
        }.bind(this), 500);
      
      if($next.length) {
        if(app.router.isMobile()) {
          $actual.before($next);
        } else {
          // dynamic effect
          actualZIndex = $actual.css("zIndex");
          nextZIndex = $next.css("zIndex");
          $actual.css({ position: "relative", zIndex: 101 });
          $next.css({position: "relative", zIndex: 100 });
          topDif = $next.offset().top - $actual.offset().top;
          leftDif = $next.offset().left - $actual.offset().left;
          heightDif = $next.height() - $actual.height();
          $next.animate({ top: -topDif, left: -leftDif }, app.router.ANIM_DURATION);
          $actual.animate({ top: topDif + heightDif, left: leftDif + widthDif}, app.router.ANIM_DURATION, function() {
            $next.css({ top: 0, left: 0, position: "static", "zIndex": nextZIndex });
            $actual.css({ top: 0, left: 0, position: "static", "zIndex": actualZIndex });
            // static effect
            $actual.before($next);
          });
        }
      }
    },
    
    /**
     * eventhandler
     */
    deleteItem: function() {
      this.updateText();
      this.dynamicRenderText();
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
    markAsPlaying: function(track, trackView) {
      if(trackView) {
        this.dynamicRender({playing: true, paused: false}, trackView);
      }
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

