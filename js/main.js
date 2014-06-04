/*function getUserPlaylist () {
    $("button").on('click', function(){
        var newPlaylist = prompt("Playlist Name:");
        return newPlaylist;
    });
};*/

/*function addUserPlaylist () {
    SC.get('/playlists/newPlaylist', function(track) {
        SC.oEmbed(track.permalink_url, document.getElementById('displayContainer'));
    });
}; */


//var trackList = [];
/* $(document).ready(function() {
  
    SC.get('/playlists/electronic', function(track) {

    //for each track in trackList, perform GET request to favoriters to search their favorited tracks
    // final display of soundcloud widget
        SC.oEmbed(track.permalink_url, document.getElementById('displayContainer'));
    }); */

//Obsolete function.
//already inside a GET request of /me
function addSongs(playlist) {
    var numTracks = 300;
    SC.get('/tracks', { limit: numTracks, q: playlist.genre, license: 'cc-by-sa'}, function(tracks) {
        $('.post').empty();
        $('.post').append($("<p>You might also want to check out</p>"));
        $(tracks).each(function(index, track) {
            var tags = ["heavy", "smooth", "melancholic", "nostalgic"];
            $('.post').append($("<div class='sugTrack' id='track_" + index + "'></div>"));
            if (track.playback_count < 40) {
                //push new track data to Firebase
                var newSugTrack = sugTracksData.push();
                newSugTrack.set({
                    trackObj: track,
                    tags: {
                        name: 'testTag',
                        score: 0
                    }
                });
                //embed track as div
                SC.oEmbed(track.permalink_url, {maxheight: '150px'}, document.getElementById("track_" + index));
            }
        });
    });
}


//-------------------------------------------------------------------------//
/*
NEW STRATEGY:
- don't display the playlist widget. // done
- only display the playlist choices as buttons for the user to choose. // done
- display the tracks in the playlist as text for user reference // done
- upon click, search for related tracks. // done ~ ineffective for now
- display found tracks ONE AT A TIME in the widget. // done ~ track loads when current one finishes.
- user plays track, computer prompts user to verify tags. // done ~ but the Google translate isn't reliably fast enough.

Wit.AI incorporation:
- User speaks any string of words. Of those, if any matches a given tag, then that tag's score is upvoted.
    Otherwise, the tag is added to the list. (simple interface)
- Skip song
- I like this song (add it to the playlist)
 */

var sugTracksData = new Firebase("https://chefspecial.firebaseio.com");
var globalPlaylist; // fake for now, to work with in loadFoundSong's recursion

SC.initialize({
    //Firebase:
    //client_id: 'd8fef5dfa959bb728846bcb61636f77a',
    //redirect_uri: 'https://chefspecial.firebaseapp.com/index.html'
    //MAC local:
    client_id: '8077356610fc30a730afebd4e4c8b422',
    //redirect_uri: 'http://localhost:8888/chefspecial/index.html'
    //WINDOWS local:
    //client_id: 'a15dbe92a311723a1ffe21a3d3fc9676',
    //redirect_uri: 'http://localhost/chefspecial/index.html'
});


function displayPlaylistTracks(playlist) {
    var trackAry = playlist.tracks.slice();
    $('#displayContainer').append("<p>Tracks in " + playlist.title + "<p>");
    $(trackAry).each(function(index, track) {
        var title = $("<div class='playlist_track_title'>" + track.title + "</div>");
        $('#displayContainer').append(title);
    });
}

/**
 * Searches for similar track to the ones in the playlist.
 * For now, fake it by using a fixed track.
 * @param  {SoundCloud playlist object} playlist Has characteristics to search off of.
 * @return {[type]}          Track object (JSON to add to Firebase)
 */
function searchForTrack(playlist) {

    //later animate this. displayElements is a wrapper for the animation.
    function displayElements() {
        $('.iframeWrapper').css('display', 'block');
        $('.tagsInput').css('display', 'block');
    }

    SC.get('/tracks', { limit: 10, q: playlist.genre, license: 'cc-by-sa'}, function(tracks) {
        $('#searchResults').html("<h3>Suggested Tracks:</h3>");
        $(tracks).each(function(index, track) {
            $('#searchResults').append("<p>" + track.title + "</p>");
        });

        displayElements();
        
        // initialize by processTracking the first track
        // get next track, a function.
        // processTrack calls callback to trigger this...
        //var track_index = 0;
        
        async.eachSeries(tracks, processTrack);
        /*function increment_and_call(track_index, processTrack) {
            track_index += 1;
                // need to check for scope.
            processTrack(tracks[track_index], increment_and_call);
        }

        processTrack(tracks[track_index], );
*/

        /*$(tracks).each(function(index, track) {
            foundTrack.trackObj = track;
            var tagString = "";
            $(track.tags).each(function(index, tag) {
                tagString += " " + tag.name;
            });
            sugTracksData.push(foundTrack);
            loadFoundSong(foundTrack, tagString);
        });*/
    });
}

var processTrack = function (track, callback) {

    var foundTrack = {
        "trackObj" : ""
    }

    //foundTrack is a model object (trackObj + tags) to push to Firebase.
    foundTrack.trackObj = track;

    // later fix to "if not already existing"
    // Structure of Firebase: children are named by track ID and have track object and tag attributes.
    // Setting up the track for modifying tags.
    var trackChild = new Firebase("https://chefspecial.firebaseio.com/" + track.id);
    trackChild.update(foundTrack);
    
    //loadFoundSong(track, foundTrack.tags, callback, trackChild);
    // foundTrack.tags nonfunctional unless updating is tackled.

    //////////////////////
    // load found song. //
    //////////////////////
    var widgetIframe = document.getElementById('sc-widget'),
        widget       = SC.Widget(widgetIframe);
        newSoundUrl = 'http://api.soundcloud.com/tracks/' + track.id; // 'http://api.soundcloud.com/tracks/13692671';
    console.log("attempting to load song " + track.title);

    widget.load(newSoundUrl, {
      show_artwork: true
    });

    widget.bind(SC.Widget.Events.READY, function() {

        /*$(foundTrack.tags).each(function(index, tag) {
            $('.existingTags').append(tag);
        });*/

        // listens for click, gets tags from input, parses it, and updates firebase.
        $('#tag_submit_button').on("click", function() {
            var new_tags_unparsed = $('#tags_input').val();
            updateSongTags(new_tags_unparsed);
        });

        function updateSongTags(new_tags_unparsed) {
            // first update tags of song in database: if new add tags, if old reinforce score.
            
            // parse 
            var tagList = new_tags_unparsed.split(", ");
            console.log(tagList);
            $(tagList).each(function(index, tag) {
                trackChild.child('tags').child(tag).set({score: 1})
            });

            //then update display of tags; should use firebase .on('value'... or 'child_added'
        }

        // *** doubts right now: is the listener for tag additions terminated properly? IT IS NOT.

        widget.bind(SC.Widget.Events.FINISH, function() {
            
            console.log("song finished!\n");

            $('#tag_submit_button').off();
            callback(); // calls the callback inside processTrack inside searchForTrack.
            //speakTags(tracks[currIndex], tagString);
      });
    });
}

//CURRENTLY UNRELIABLE//
function speakTags(track, tagString) {
    var tts = new GoogleTTS();
    var tagString = "";
    $(track.tags).each(function(index, tag) {
        tagString += " " + tag.name;
    });

    //console.log(track.trackObj.tag_);
    tts.play("This song was tagged", 'en', function() {
        tts.play(tagString + ".", 'en', function() {
            console.log('hello'); // wanted to test whether the request went through and callback was called...
            tts.play("Which of these tags sound most accurate to you?", 'en', searchForTrack(globalPlaylist));
        });
    });
    //callback should be to autoplay the next song.
    //GOOGLE TTS HIDDENTAO LIBRARY IS NOT RELIABLE.
}

////////////////////
// initialization //
////////////////////
$(document).ready(function(){
    //test code uses sample playlist.
    SC.get('/playlists/36510794', function(playlist) {
        //$('#username').html(me.username);
        //console.log(playlist.permalink_url);
        var ele = $("<button>")//.data("arrayIndex", index)
                        .on("click", function() {
                            //playlist process and render here
                            //addSongs(playlist);
                            //SC.put(playlist.uri, { playlist: { tracks: [144437169] } });
                            globalPlaylist = playlist;
                            displayPlaylistTracks(playlist);
                            searchForTrack(playlist); // calls loadFoundSong when done
                        });
        $('.playlistWrapper').append(ele);
        $(ele).html(playlist.title);
    });
/*   $('a.connect').on('click', function(e){
        e.preventDefault();
        SC.connect(function(){
            SC.get('/me', function(me){
                $('#username').html(me.username);
            });
            SC.get('/me/playlists/', function(playlists) {
                //$('#username').html(me.username);
                $(playlists).each(function(index, playlist) {
                    //console.log(playlist.permalink_url);
                    var ele = $("<button>")//.data("arrayIndex", index)
                                    .on("click", function() {
                                        //playlist process and render here
                                        //addSongs(playlist);
                                        //SC.put(playlist.uri, { playlist: { tracks: [144437169] } });
                                        globalPlaylist = playlist;
                                        displayPlaylistTracks(playlist);
                                        searchForTrack(playlist); // calls loadFoundSong when done

                                    });
                    $('.playlistWrapper').append(ele);
                    $(ele).html(playlist.title);
                });
            });
        });
    });*/
});