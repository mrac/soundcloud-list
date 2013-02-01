// Set the require.js configuration for your application.
require.config({

  // Initialize the application with the main application file and the JamJS
  // generated configuration file.
  deps: ["../vendor/jam/require.config", "main"],

  paths: {
    "jquery": "//ajax.googleapis.com/ajax/libs/jquery/1.9.0/jquery.min",
    "backbone": "//cdnjs.cloudflare.com/ajax/libs/backbone.js/0.9.10/backbone-min",
    "underscore": "//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min",
    "lodash": "//cdnjs.cloudflare.com/ajax/libs/lodash.js/1.0.0-rc.3/lodash.min",
    "backbone.layoutmanager": "../vendor/jam/backbone.layoutmanager/backbone.layoutmanager.min",
    "backbone-localStorage": "../vendor/jam/backbone-localStorage/backbone-localStorage.min"
  },

  shim: {
    // Put shims here.
  }

});
