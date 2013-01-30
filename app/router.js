define([
  // Application.
  "app",

  // Modules.
  "modules/playlist",
  "modules/search"

],

function(app) {

  // Defining the application router, you can attach sub routers here.
  var Router = Backbone.Router.extend({
    routes: {
      "": "index"
    },

    initialize: function() {
      // Initialize SoundCloud SDK
      this.initSoundCloud();
      
      // Set up collections
      this.searchItems = new Search.Collection();
      this.playlistItems = new Playlist.Collection();

      // Use main layout and set views
      app.useLayout("main-layout")
      .setViews({
        ".search-container": new Search.Views.List({
          searchItems: this.searchItems
        }),
        ".playlist-container": new Playlist.Views.List({
          playlistItems: this.playlistItems
        })
      })
      .render();
    },

    index: function() {
      this.reset();
    },

    reset: function() {
      // Reset search items to initial state
      if(this.searchItems.length) {
        this.searchItems.reset();
      }
    },

    initSoundCloud: function() {
      SC.initialize({
        client_id: "YOUR_CLIENT_ID"
      });
    }
  });

  

  return Router;

});
