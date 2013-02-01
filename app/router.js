define([
  // Application.
  "app",

  // Modules.
  "modules/playlist",
  "modules/search"

],

function(app, Playlist, Search) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    
    visiblePercent: 50,
    VISIBLE_PERCENT_MAX: 50,
    VISIBLE_PERCENT_MIN: 15,
    
    routes: {
      // states
      "": "index",
      "search/(:query)": "search",
      "play/:track": "play",
      "pause/:track": "pause",
      
      // actions
      "add/:track": "add"
    },

    initialize: function() {
      // Create collections and fetch playlist from the storage.
      this.searchItems = new Search.Collection();
      this.playlistItems = new Playlist.Collection();
      this.playlistItems.fetch();
      this.playlistItems.sort();
      this.playlistItems.clearStatusAll();

      // Initializations.
      this.initSoundCloud();
      this.setViews();
      this.setGlobalEvents();
      this.setJQueryEvents();
    },

    /**
     * Shortcut for building a url.
     * @param {...} varargs       Variable number of arguments
     */
    go: function(varargs) {
      return this.navigate(_.toArray(arguments).join("/"), true);
    },
    
    /**
     * Initialize SoundCloud SDK.
     */
    initSoundCloud: function() {
      SC.initialize({
        client_id: "YOUR_CLIENT_ID"
      });
    },

    /**
     * Use main layout and set views
     */
    setViews: function() {
      app.useLayout("main-layout")
      .setViews({
        ".search-container": new Search.Views.List({
          collection: this.searchItems
        }),
        ".playlist-container": new Playlist.Views.List({
          collection: this.playlistItems
        })
      })
      .render();
    },
    
    /**
     * Set global events.
     */
    setGlobalEvents: function() {
      this.listenTo(app, {
        "global:play": this.goPlay,
        "global:pause": this.goPause
      });
    },
    
    /**
     * Set some jQuery global events.
     */
    setJQueryEvents: function() {
      setTimeout(function() {
        // Set event for toggling up/down the playlist/searchbox views.
        jQuery('#top .logo, #top .title').bind("click", function() {
          var top, bottom;
          if(this.visiblePercent === this.VISIBLE_PERCENT_MAX) {
            this.visiblePercent = this.VISIBLE_PERCENT_MIN;
          } else {
            this.visiblePercent = this.VISIBLE_PERCENT_MAX;
          }
          top = this.visiblePercent;
          bottom = 100 - top;
          console.log(top);
          $('#top').animate({height: top+"%"}, 200);
          $('#line1').animate({top: top+"%"}, 200);
          $('#line2').animate({top: top+"%"}, 200);
          $('#line3').animate({top: top+"%"}, 200);
          $('#bottom').animate({top: top+"%"}, 200);
          $('#bottom').animate({height: bottom+"%"}, 200);
        }.bind(this));
      }.bind(this), 500);
    },
    
    /**
     * Checks if the device is a smartphone.
     */
    isMobile: function() {
      // the below conditional css rule is created by @media tag in css file
      // #mobile-detector { display: none}
      // so here we can detect it
      return ($('#mobile-detector').css('display') == "none");
    },
    
    /**
     * Checks if the device has a touch-screen.
     */
    isTouchScreen: function() {
      return !!('ontouchstart' in window) // works on most browsers 
        || !!('onmsgesturechange' in window); // works on ie10
    },
    
    /**
     * state
     */
    index: function() {
      this.searchItems.reset();
    },
    
    /**
     * state
     * @param {String} searchQuery
     */
    search: function(searchQuery) {
      searchQuery = searchQuery || "";
      this.searchItems.search(decodeURIComponent(searchQuery));
    },
    
    /**
     * state
     * @param {String} trackId
     */
    play: function(trackId) {
      this.playlistItems.playById(trackId);
    },
    
    /**
     * state
     * @param {String} trackId
     */
    pause: function(trackId) {
      this.playlistItems.pauseById(trackId);
    },
    
    /**
     * action
     * @param {String} trackIdentifier
     */
    add: function(trackIdentifier) {
      trackIdentifier = trackIdentifier && decodeURIComponent(trackIdentifier);
      if(trackIdentifier && trackIdentifier.match("/")) {
        // track path
        this.playlistItems.addByPath(trackIdentifier);
      } else {
        // track id
        this.playlistItems.addById(trackIdentifier);
      }
      app.router.navigate("", {trigger: false, replace: true});
    },
        
    /**
     * global eventhandler
     */
    goPlay: function(track) {
      app.router.go("play", track.id);
    },
    
    /**
     * global eventhandler
     */
    goPause: function(track) {
      app.router.go("pause", track.id);
    }
    
    
  });

  

  return Router;

});
