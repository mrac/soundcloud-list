define([
  // Application.
  "app",
  
  // Models.
  "models/track"
],

function(app, Track) {

  /**
   * SearchTracks collection.
   * @constructor
   * @property {String}   query
   * @event               searchstart
   * @event               searcherror
   */
  var SearchTracks = Backbone.Collection.extend({
    model: Track,
    
    /**
     * Search tracks in SoundCloud and add them to the collection.
     */
    search: function(searchQuery) {
        var pageSize = 10;
        this.query = searchQuery;
        if(searchQuery) {
          // Fetch soundcloud tracks and update the collection, if query is not empty.
          SC.get('/tracks', { q: searchQuery, limit: pageSize }, function(tracks, err) {
            if(!err) {
              console.log(tracks);
              app.trigger("global:searchcomplete", searchQuery);
              this.reset(tracks);
            } else {
              console.log("Error while getting a list of tracks from SoundCloud: ", err);
              alert("Error while getting a list of tracks from SoundCloud");
              this.trigger("searcherror");
              this.reset();
            }
          }.bind(this));
          this.trigger("searchstart");
        } else {
          // Reset the collection, if query is empty.
          this.trigger("searchstart");
          this.trigger("search");
          this.reset();
        }
    }
    
  });



  return SearchTracks;

});
