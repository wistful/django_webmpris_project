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


MPRISPlayer = function(playerID) {
    var playerID = playerID;
    var webmprisAPI = "/webmpris/api/players/" + playerID;
    var pid = '[pid="' + playerID + '"]';
    var props;     // properties
    var tracker;  // tracker slider
    var volume;   // volume slider
    var timeHdl;  // setTimeout result
    var trackID; // now playing track


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
                // alert(status + ", " + error);
                if (request.status == 404) {
                    suicide();
                }
            },
        })
    }

    function suicide() {
        clearTimeout(timeHdl);
        $(pid).parent().remove();
    }

    function CreatePlayer() {
        $('#player-template > div').clone().appendTo("#main").find('.media').attr("pid", playerID);
        fn = function(data) {$(pid).find('label').text(data['Identity']);}
        _ajax(webmprisAPI + "/Root", {}, "GET", fn);
        initSliders();
        InitPlayer();
    }

    function InitPlayer() {
        // play click
        $(pid).find('.play').click(function(e) {
            e.preventDefault();
            play();
        });

        // pause click
        $(pid).find('.pause').click(function(e) {
            e.preventDefault();
            pause();
        });

        // forward click
        $(pid).find('.fwd').click(function(e) {
            e.preventDefault();
            next();
        });

        // rewind click
        $(pid).find('.rew').click(function(e) {
            e.preventDefault();
            previous();
        });

        // show playlist
        $(pid).find('.pl').click(function(e) {
            e.preventDefault();

            $(pid).find('.playlist').fadeIn(300);
        });
        // refresh();
        _setTimeout();
    }

    function UpdatePlayer(obj) {

        function updateLabels(data) {
            $(pid).find('.player .title').text(data.Title);
            $(pid).find('.player .artist').text(data.Artists);
            if (data.Cover) {
                var coverUrl = '/player/cover?path=' + encodeURIComponent(data.Cover);
                $(pid).find('.player .cover img').attr("src", coverUrl);
            }
        }

        function updateSlides(data) {
            volume.slider("option", "max", 100);
            volume.slider("value", data.Volume * 100);
            tracker.slider("option", "max", data.Length);
            tracker.slider("value", data.Position);
        }

        function updateControls(data) {
            if (data.PlaybackStatus == "Playing" && $(pid).find('.pause:hidden').length > 0) {
                $(pid).find('.play').removeClass('visible').addClass('hidden');
                $(pid).find('.pause').removeClass('hidden').addClass('visible');
            }
            if (data.PlaybackStatus != "Playing" && $(pid).find('.play:hidden').length > 0) {
                $(pid).find('.play').removeClass('hidden').addClass('visible');
                $(pid).find('.pause').removeClass('visible').addClass('hidden');
            }
        }

        var _props = {
            'Next': obj.CanGoNext,
            'Prev': obj.CanGoPrevious,
            'Play': obj.CanPlay,
            'Pause': obj.CanPause,
            'Volume': obj.Volume,
            'Position': obj.Position,
            'PlaybackStatus': obj.PlaybackStatus,
            'Cover': 'mpris:artUrl' in obj.Metadata ? obj.Metadata['mpris:artUrl'] : '',
            'Length': 'mpris:length' in obj.Metadata ? obj.Metadata['mpris:length'] : 0,
            'TrackId': 'mpris:trackid' in obj.Metadata ? obj.Metadata['mpris:trackid'] : '',
            'Artists': 'xesam:artist' in obj.Metadata ? obj.Metadata['xesam:artist'].join(", ") : 'Unknown Artist',
            'Title': 'xesam:title' in obj.Metadata ? obj.Metadata['xesam:title'] : 'Unknown Title'
        }

        if (!props || _props.TrackId != props.TrackId) {
            updateLabels(_props || props);
        }

        if (!props || _props.Position != props.Position) {
            updateSlides(_props || props);
        }

        props = _props;

        updateControls(props)

    }


    function play(success, error) {
        var success = function(data) {
            $(pid).find('.play').addClass('hidden').removeClass('visible');
            $(pid).find('.pause').addClass('visible').removeClass('hidden');
        }
        _ajax(webmprisAPI + "/Player/Play", {}, "POST", success, error);
    }

    function stop(success, error) {
        var success = function(data) {
            $(pid).find('.play').removeClass('hidden').removeClass('visible');
            $(pid).find('.pause').removeClass('visible').removeClass('hidden');
        }
        _ajax(webmprisAPI + "/Player/Stop", {}, "POST", success, error);
    }

    function pause(success, error) {
        var success = function(data) {
            $(pid).find('.play').removeClass('hidden').removeClass('visible');
            $(pid).find('.pause').removeClass('visible').removeClass('hidden');
        }
        _ajax(webmprisAPI + "/Player/Pause", {}, "POST", success, error);
    }

    function next(success, error) {
        _ajax(webmprisAPI + "/Player/Next", {}, "POST", success, error);
    }

    function previous(success, error) {
        _ajax(webmprisAPI + "/Player/Previous", {}, "POST", success, error);
    }

    function volume_(value, success, error) {
        if (value == undefined || value == null) {
            return volume.slider("value");
        } else {
            setProperties({
                "Volume": value
            });
        }
    }

    function setProperties(data, success, error) {
        _ajax(webmprisAPI + "/Player", data, "PUT", success, error);
    }

    function position(value, success, error) {
        if (value == undefined) {
            return tracker.slider("value");
        } else {
            _ajax(webmprisAPI + "/Player/SetPosition", {
                "args": [props.TrackId, value]
            }, "POST", success, error);
        }
    }

    function refresh() {
        var success = function(data) {
            _setTimeout();
            UpdatePlayer(data);
        }
        _ajax(webmprisAPI + "/Player", {}, "GET", success);
    }

    function _setTimeout() {
        timeHdl = setTimeout(refresh, 5000);
    }

    function initSliders() {
        tracker = $(pid).find('.tracker');
        volume = $(pid).find('.volume');

        // volume slider
        volume.slider({
            range: 'min',
            min: 1,
            max: 100,
            value: 80,
            start: function(event, ui) {},
            slide: function(event, ui) {},
            stop: function(event, ui) {
                volume_(ui.value / 100);
            },
        });

        // tracker slider
        tracker.slider({
            range: 'min',
            min: 0,
            max: 100,
            value: 10,
            start: function(event, ui) {},
            slide: function(event, ui) {},
            stop: function(event, ui) {
                position(ui.value);
            }
        });
    }
    

    // InitPlayer();
    CreatePlayer();
}
jQuery(document).ready(function() {
    checkPlayers();
});