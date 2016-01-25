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
    
    ANIM_DURATION: 100,
    
    routes: {
      // States.
      "":                 "_index",
      "search/(:query)":  "_search",
      "play/:track":      "_play",
      "pause/:track":     "_pause",
      
      // Actions.
      "add/:track":       "_add"
    },

    initialize: function() {
      // Global events.
      this.listenTo(app, {
        "global:play":    this._goPlay,
        "global:pause":   this._goPause
      });
      
      // Create views.
      this._searchListView = new Search.Views.List();
      this._playlistListView = new Playlist.Views.List();
      
      // Initializations.
      this._setViews();
      this._initSoundCloud();

      // Mobile/tablets hacks.
      this._initFastClick();
      this._initViewsToggle();
      this._setTouchClass();
      this._fixIPhoneScrolling();
    },
      
      
      
      
      
      
    // =========================== PUBLIC =============================
        
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
    
    
    





    // =========================== PROTECTED =============================
    
    // Must use either 'px' or '%' units.
    _topSectionHeight: "50%",
    _TOP_SECTION_HEIGHT_MAX: "50%",
    _TOP_SECTION_HEIGHT_MIN: "49px",
    
    /**
     * Use main layout and set views
     */
    _setViews: function() {
      app.useLayout("main-layout")
      .setViews({
        ".search-container": this._searchListView,
        ".playlist-container": this._playlistListView
      })
      .render();
    },
    
    /**
     * Initialize SoundCloud SDK.
     */
    _initSoundCloud: function() {
      SC.initialize({
        client_id: "3b1765cc25af2c8de26711c7bc9b3a43"
      });
    },
    
    /**
     * Fixes iPhone click delay.
     */
    _initFastClick: function() {
      new FastClick(document.body);
    },
    
    /**
     * Slides top and bottom sections up and down.
     */
    _slideSection: function() {
      var topHeight, bottomHeight, topH, bottomH;
      if(this._topSectionHeight === this._TOP_SECTION_HEIGHT_MAX) {
        this._topSectionHeight = this._TOP_SECTION_HEIGHT_MIN;
      } else {
        this._topSectionHeight = this._TOP_SECTION_HEIGHT_MAX;
      }
      topHeight = this._topSectionHeight;
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
     * Set event for toggling up/down the playlist/searchbox views.
     */
    _initViewsToggle: function() {
      $(document).on("click", "#titlebar", this._slideSection.bind(this));
    },
    
    /**
     * Enable css filtering for touch devices.
     */
    _setTouchClass: function() {
      if(this.isTouchScreen()) {
        $("#main").addClass("touch");
      } else {
        $("#main").addClass("no-touch");
      }
    },
    
    /**
     * Prevents iPhone rubber effect while scrolling.
     */
    _fixIPhoneScrolling: function() {
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
    
    
    
    
    
    // =========================== STATES =============================

    /**
     * state
     */
    _index: function() {
      this._searchListView.empty();
    },
    
    /**
     * state
     * @param {String} searchQuery
     */
    _search: function(searchQuery) {
      searchQuery = searchQuery || "";
      this._searchListView.search(decodeURIComponent(searchQuery));
    },
    
    /**
     * state
     * @param {String} trackId
     */
    _play: function(trackId) {
      this._playlistListView.playById(trackId);
    },
    
    /**
     * state
     * @param {String} trackId
     */
    _pause: function(trackId) {
      this._playlistListView.pauseById(trackId);
    },
    
    





    // =========================== ACTIONS =============================
    
    /**
     * action
     * @param {String} trackIdentifier
     */
    _add: function(trackIdentifier) {
      trackIdentifier = trackIdentifier && decodeURIComponent(trackIdentifier);
      if(trackIdentifier && trackIdentifier.match("/")) {
        // track path
        this._playlistListView.addByPath(trackIdentifier);
      } else {
        // track id
        this._playlistListView.addById(trackIdentifier);
      }
      app.router.navigate("", {trigger: false, replace: true});
    },
        
    
    
    
    
    // =========================== GLOBAL EVENT HANDLERS =============================
    
    /**
     * global eventhandler
     */
    _goPlay: function(track) {
      app.router.go("play", track.id);
    },
    
    /**
     * global eventhandler
     */
    _goPause: function(track) {
      app.router.go("pause", track.id);
    }
    

    
    
  });

  

  return Router;

});
