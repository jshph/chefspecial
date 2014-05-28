var sugTracksData = new Firebase("https://chefspecial.firebaseio.com");
SC.initialize({
    //MAC:
    client_id: 'd8fef5dfa959bb728846bcb61636f77a',
    redirect_uri: 'https://chefspecial.firebaseapp.com/index.html'
    //WINDOWS:
    //client_id: 'd8fef5dfa959bb728846bcb61636f77a',
    //redirect_uri: 'http://localhost/chefspecial/test.html'
});

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

/*
NEW STRATEGY:
- don't display the playlist widget. // done
- only display the playlist choices as buttons for the user to choose. // done
- display the tracks in the playlist as text for user reference // done
- upon click, search for related tracks. // done ~ ineffective for now
- display found tracks ONE AT A TIME in the widget. // done ~ track loads when current one finishes.
- user plays track, computer prompts user to verify tags. etc etc...
 */

function displayPlaylistTracks(playlist) {
    var trackAry = playlist.tracks.slice();
    //console.log(trackAry);
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
    var foundTrack = {
        "trackObj" : "",
        "tags" : [
            {
                name: "test tag",
                score : 0
            } ,
            {
                name: "test tag 2",
                score: 0
            }
        ]
        }
    SC.get('/tracks', { limit: 1, q: playlist.genre, license: 'cc-by-sa'}, function(tracks) {
        foundTrack.trackObj = tracks[0];
        loadFoundSong(foundTrack);
    });
}

/**
 * After a new song is found, it's loaded in the player.
 * Starts out with default track, but once that finishes, the found song
 * is loaded into that widget. Recursive in that searchForTrack will search
 * and then call loadFoundSong again.
 * 
 * @param  {[type]} track [description]
 * @return {[type]}       [description]
 */
function loadFoundSong(track) {
    var widgetIframe = document.getElementById('sc-widget'),
        widget       = SC.Widget(widgetIframe);
        newSoundUrl = 'http://api.soundcloud.com/tracks/' + track.trackObj.id; // 'http://api.soundcloud.com/tracks/13692671';

    console.log("attempting to load song");
    widget.bind(SC.Widget.Events.READY, function() {

      widget.bind(SC.Widget.Events.FINISH, function() {
        console.log("song finished!");
        widget.load(newSoundUrl, {
          show_artwork: false
        });

        // tag feedback here.
        speakTags(track); //recursion in here.
      });
    });
}

function speakTags(track) {
    var tts = new GoogleTTS();
    var tagString = "";
    $(track.tags).each(function(index, tag) {
        tagString += " " + tag.name;
    });

    var speakString = "This song was tagged" + tagString + ". Which of these tags sound most accurate to you?";

    tts.play(speakString, searchForTrack(globalPlaylist)); //callback should be to autoplay the next song.
}

var globalPlaylist; // fake for now, to work with in loadFoundSong's recursion

$(document).ready(function(){
   $('a.connect').on('click', function(e){
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
                                        //console.log(foundTrack);
                                        //loadFoundSong(foundTrack.trackObj[0]);
                                    });
                    $('.playlistWrapper').append(ele);
                    $(ele).html(playlist.title);
                });
                //addUserPlaylist();
            });
        });
    });
});
    
        /*$('a.connect').on('click', function(e) {
            e.preventDefault();
            SC.connect(function(){
            SC.get('/me', function(me) {
                $('#username').html(me.username);
            SC.isConnected();   
            });
        });
      }); */    
    
// });