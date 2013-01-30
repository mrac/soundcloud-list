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
      "": "index",
      "search/:query": "search",
      "add/:track": "add",
      "remove/:track": "remove"
    },

    initialize: function() {
      this.searchItems = new Search.Collection();
      this.playlistItems = new Playlist.Collection();
      this.initSoundCloud();
      this.setViews();
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
     * action
     */
    index: function() {
      this.searchItems.reset();
    },
    
    /**
     * action
     * @param {String} searchQuery
     */
    search: function(searchQuery) {
      this.searchItems.search(searchQuery);
    },
    
    /**
     * action
     * @param {String} trackId
     */
    add: function(trackId) {
      this.playlistItems.add(trackId);
    },
    
    /**
     * action
     * @param {String} trackId
     */
    remove: function(trackId) {
      this.playlistItems.remove(trackId);
    },
    
  });

  

  return Router;

});
