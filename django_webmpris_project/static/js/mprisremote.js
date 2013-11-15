window.players = {};

checkPlayers = function() {
    _ajax("/webmpris/api/players", {}, "GET", initPlayers);
    setTimeout(checkPlayers, 5000);
}

function _ajax(url, data, method, success, error) {
    if (method == "PUT" || method == "POST") {
        data = JSON.stringify(data);
    }
    $.ajax({
        url: url,
        cache: false,
        dataType: 'json',
        data: data || {},
        type: method || "GET",
        success: success || function(data, status, response) {
            // alert(data);
            ;
        },
        error: error || function(request, status, error) {
            alert(status + ", " + error);
        },
    })
}


initPlayers = function(players) {
    for (var i = 0; i < players.length; i++) {
        if (players[i] in window.players) {
            ;
        }
        else {
            window.players[players[i]] = MPRISPlayer(players[i]);
        }
    }
}

jQuery(document).ready(function() {
    checkPlayers();
});