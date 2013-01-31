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
        "global:pause": this.goPause,
        "global:addTrack": this.addTrack
      });
    },
    
    /**
     * Checks if the device is a mobile.
     */
    isMobile: function() {
      return (window.innerWidth <= 800 && window.innerHeight <= 600);
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
     * @param {String} trackId
     */
    add: function(trackId) {
      this.playlistItems.addById(trackId);
      app.router.navigate("", {trigger: false, replace: true});
    },
    
    /**
     * global eventhandler
     */
    addTrack: function(track) {
      var newTrack = track.clone();
      this.playlistItems.add(newTrack);
      newTrack.save();
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
