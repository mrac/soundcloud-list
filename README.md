
# What SoundCloud List ? #
A simple web application for creating locally stored playlists of any audios provided by SoundCloud.com.

# Application URL #
http://mrac.github.com/soundcloud-list

# Short description #
The app is divided into two views. Top is where we can search for audios, browse the list of found tracks and add them to the playlist.
The playlist is the bottom part. There we can do more:
 - Play or pause streaming by clicking at the track item. The next track will automatically play after one is finished.
 - Expand the more-options panel by clicking at the image on the left. There we can move the item up/down or remove it.

The top view with the searchbox can be collapsed/expanded by clicking at the logo on the top.

# Development environment #
All coded in JavaScript, XHTML, CSS.
Used [Backbone boilerplate](https://github.com/tbranyen/backbone-boilerplate) for general app structure.
It uses some js libraries like:
 - require.js
 - underscore
 - backbone
 - backbone.layoutmanager
 - jquery
 - lodash
 - html5 boilerplate
 and many other development tools grouped in [bbb](https://github.com/backbone-boilerplate/grunt-bbb).

# Application bookmarks #
Soundcloud List remembers application states encoded in URL hashes. We can use the URL links to bring the app in the specific state.

What states can be encoded in links:
 - play specific track from the playlist
 - highlight and pause specific track from the playlist
 - bring specific search results
 - 
Using URL link we can also perform an action of adding the track to the list.

# Brief description of the code #
There are 3 main javascript files:
 - app/router.js
 - app/modules/search.js
 - app/modules/playlist.js

The others are HTML templates in directory:
 - app/templates

And css file:
 - app/styles/app.css

And the bootstrap html page which is mostly auto generated:
 - index.html


The rest is just a boilerplate stuff, configuration and third-party libraries.

