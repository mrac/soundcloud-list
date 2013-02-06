define([
  // Application.
  "app",

  // Models.
  "models/track",
  
  // Collections.
  "collections/playlisttracks"
  
],

function(app, Track, PlaylistTracks) {

  
  var Playlist = app.module();
  
    
  
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
      if(Track.currentTrackId == this.model.get("id")) {
        // If clicked the same track..
        if(Track.currentSound && Track.currentSound.paused) {
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
      
      // Fetch the collection and sort it.
      this.collection = new PlaylistTracks();
      this.collection.fetch();
      this.collection.sort();
      
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
     * Play audio by track id.
     */
    playById: function(trackId) {
      this.collection.playById(trackId);
    },
    
    /**
     * Pause audio by track id.
     */
    pauseById: function(trackId) {
      this.collection.pauseById(trackId);
    },
    
    /**
     * Add audio by track id.
     */
    addById: function(trackId) {
      this.collection.addById(trackId);
    },
    
    /**
     * Add audio by track path.
     */
    addByPath: function(trackPath) {
      this.collection.addByPath(trackPath);
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

