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
        "global:remove": this.goRemove,
        "global:add": this.goAdd
      });
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
      this.searchItems.search(decodeURIComponent(searchQuery));
    },
    
    /**
     * action
     * @param {String} trackId
     */
    add: function(trackId) {
      this.playlistItems.addById(trackId);
    },
    
    /**
     * action
     * @param {String} trackId
     */
    remove: function(trackId) {
      this.playlistItems.removeById(trackId);
    },
    
    /**
     * global eventhandler
     */
    goRemove: function(model) {
      app.router.go("remove", model.id);
    },
    
    /**
     * global eventhandler
     */
    goAdd: function(model) {
      app.router.go("add", model.id);
    }
    
    
  });

  

  return Router;

});
