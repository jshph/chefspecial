var sugTracksData = new Firebase("https://chefspecial.firebaseio.com");
SC.initialize({
    //MAC:
    client_id: '8077356610fc30a730afebd4e4c8b422',
    redirect_uri: 'http://localhost:8888/chefspecial/test.html'
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
                                        addSongs(playlist);
                                        //SC.put(playlist.uri, { playlist: { tracks: [144437169] } });
                                        SC.oEmbed(playlist.permalink_url, document.getElementById('displayContainer'));
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