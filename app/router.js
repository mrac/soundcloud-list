define([
  // Application.
  "app"
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
    },

    index: function() {

    },

    initSoundCloud: function() {
      SC.initialize({
        client_id: "YOUR_CLIENT_ID"
      });
    }
  });

  return Router;

});
