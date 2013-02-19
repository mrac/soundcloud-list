# What is SoundCloud List ? #
A simple web application for creating locally stored playlists of any audios provided by [SoundCloud](http://soundcloud.com).
The app is supposed to work on both desktop browsers and iOS/Android mobile and tablet devices.

# Application URL #
http://mrac.github.com/soundcloud-list

# Short description #
The app is divided into two views - top and bottom. The top is where we can search for audios, browse the list of found tracks and add them to the playlist.
The playlist is the bottom part. There we can do more:
 - Play or pause streaming by clicking at the track item. The next track will automatically play after one is finished.
 - Expand the more-options panel by clicking at the image on the left. There we can move the item up/down or remove it.

The top view with the searchbox can be collapsed/expanded by clicking at the logo on the top.

# SDK #
The app uses SoundCloud API and [SoundCloud JavaScript SDK](https://developers.soundcloud.com/docs).

# ToDo #
 - UI testing
 - drag & drop, more touch gestures
 - make some workarounds over bugs appearing in IE8 (related to SoundCloud SDK)
 - support for longer search results list
 - more audio information
 - downloading audios
