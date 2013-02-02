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
    
    // Must use either 'px' or '%' units.
    topSectionHeight: "50%",
    TOP_SECTION_HEIGHT_MAX: "50%",
    TOP_SECTION_HEIGHT_MIN: "56px",
    
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
      this.initJQuery();
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
    initJQuery: function() {
      setTimeout(function() {
        // Set event for toggling up/down the playlist/searchbox views.
        $("#titlebar").bind("click", this.slideSection.bind(this));
        
        // Enable css filtering for touch devices.
        if(this.isTouchScreen()) {
          $("#main").addClass("touch");
        } else {
          $("#main").addClass("no-touch");
        }
      }.bind(this), 500);
    },
    
    /**
     * Slides top and bottom sections up and down.
     */
    slideSection: function() {
      var topHeight, bottomHeight, topH, bottomH;
      if(this.topSectionHeight === this.TOP_SECTION_HEIGHT_MAX) {
        this.topSectionHeight = this.TOP_SECTION_HEIGHT_MIN;
      } else {
        this.topSectionHeight = this.TOP_SECTION_HEIGHT_MAX;
      }
      topHeight = this.topSectionHeight;
      if(topHeight.match(/px/)) {
        topH = topHeight.replace(/px/, "");
        bottomH = $(window).height() - topH;
        bottomHeight = bottomH + "px";
      } else {
        // presumes '%' if not 'px'
        topH = topHeight.replace(/\%/, "");
        bottomH = 100 - topH;
        bottomHeight = bottomH + "%";
      }
      $('#top').animate({height: topHeight}, 200);
      $('.sliding').animate({top: topHeight}, 200);
      $('#bottom').animate({height: bottomHeight}, 200);
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
