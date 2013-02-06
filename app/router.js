define([
  // Application.
  "app",

  // Modules.
  "modules/playlist",
  "modules/search"

],

function(app, Playlist, Search) {

  console.log = function(txt) {
    $('#logo').before("<div style='font-size:7px'>"+txt+"</div>");
  };

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    
    // Must use either 'px' or '%' units.
    topSectionHeight: "50%",
    TOP_SECTION_HEIGHT_MAX: "50%",
    TOP_SECTION_HEIGHT_MIN: "49px",
    ANIM_DURATION: 100,

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
      // Create views.
      this.searchListView = new Search.Views.List();
      this.playlistListView = new Playlist.Views.List();
      
      // Initializations.
      this.setViews();
      this.initSoundCloud();
      this.setGlobalEvents();

      // Mobile/tablets hacks.
      this.initFastClick();
      this.initViewsToggle();
      this.setTouchClass();
      this.fixIPhoneScrolling();
    },

    /**
     * Shortcut for building a url.
     * @param {...} varargs       Variable number of arguments
     */
    go: function(varargs) {
      // Deley the routing for slow javascript engines, to perform necessary actions before routing.
      var path = _.toArray(arguments).join("/");
      setTimeout(function() {
        return this.navigate(path, {trigger: true});
      }.bind(this), 200);
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
        ".search-container": this.searchListView,
        ".playlist-container": this.playlistListView
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
     * Set event for toggling up/down the playlist/searchbox views.
     */
    initViewsToggle: function() {
      $(document).on("click", "#titlebar", this.slideSection.bind(this));
    },
    
    /**
     * Enable css filtering for touch devices.
     */
    setTouchClass: function() {
      if(this.isTouchScreen()) {
        $("#main").addClass("touch");
      } else {
        $("#main").addClass("no-touch");
      }
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
     * Fixes iPhone click delay.
     */
    initFastClick: function() {
      new FastClick(document.body);
    },
    
    /**
     * Prevents iPhone rubber effect while scrolling.
     */
    fixIPhoneScrolling: function() {
      // Scrollable elements should be marked via "scroll" class
      $(document).on("touchmove", ".scroll", function(ev) {
        if(this.offsetHeight === this.scrollHeight) {
          ev.preventDefault();
        } else {
          startY = ev.originalEvent.touches[0].pageY;
          startTopScroll = this.scrollTop;
          if(startTopScroll <= 0) this.scrollTop = 1;
          if(startTopScroll + this.offsetHeight >= this.scrollHeight) {
            this.scrollTop = this.scrollHeight - this.offsetHeight - 1;
          }
        }
      });
      // Elements non-scrollable (like inputs) should be marked via "no-scroll" class
      $(document).on("touchmove", ".no-scroll", function(ev) {
        ev.preventDefault();
      });
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
      this.searchListView.collection.reset();
    },
    
    /**
     * state
     * @param {String} searchQuery
     */
    search: function(searchQuery) {
      searchQuery = searchQuery || "";
      this.searchListView.collection.search(decodeURIComponent(searchQuery));
    },
    
    /**
     * state
     * @param {String} trackId
     */
    play: function(trackId) {
      this.playlistListView.collection.playById(trackId);
    },
    
    /**
     * state
     * @param {String} trackId
     */
    pause: function(trackId) {
      this.playlistListView.collection.pauseById(trackId);
    },
    
    /**
     * action
     * @param {String} trackIdentifier
     */
    add: function(trackIdentifier) {
      trackIdentifier = trackIdentifier && decodeURIComponent(trackIdentifier);
      if(trackIdentifier && trackIdentifier.match("/")) {
        // track path
        this.playlistListView.collection.addByPath(trackIdentifier);
      } else {
        // track id
        this.playlistListView.collection.addById(trackIdentifier);
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
