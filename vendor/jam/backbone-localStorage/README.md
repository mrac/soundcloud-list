jam-Backbone.localStorage
=========================

Quite simply a localStorage adapter for Backbone. It's a drop-in replacement for Backbone.Sync() to handle saving to a localStorage database.

## Usage

    define(['backbone', 'backbone-localStorage'], function(Backbone) {
      window.SomeCollection = Backbone.Collection.extend({

        localStorage: new Backbone.LocalStorage("SomeCollection"), // Unique name within your app.

        // ... everything else is normal.

      });
    });

For more, see: [https://github.com/jeromegn/Backbone.localStorage](https://github.com/jeromegn/Backbone.localStorage)