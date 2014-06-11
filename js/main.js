/// <reference path="linker.js" />

var Main = (function () {

    function setCanvasGlobals() {
        canvas = $("canvas")[0];
        ctx = canvas.getContext("2d");
        
        FULLW = canvas.width;
        FULLH = canvas.height - game.padHUD;
        HALFW = FULLW / 2;
        HALFH = FULLH / 2;
    }

    function loadingScreen() {
        ctx.fillStyle = "#e1e1e1";
        ctx.font = "25px 'Press Start 2P'";
        ctx.fillText("LOADING...", HALFW - 80, HALFH + 20);
    }

    function debug() {
        // dev enviroment
        if (location.hostname === "jonsquest") {
            window.DEBUG = true;
            window.DEBUG_OPT = {
                'lvl': 3
            };

            // speed up canvas transition
            $(canvas).css({"transition": "opacity 0.01s"});

            // skip start screen
            lastKeyDown = KeyCode.ENTER;

            // mute audio
            //audio.handleMuteButton();
        }
    }


    return {
        init: function () {
            setCanvasGlobals();
            loadingScreen();

            hero.init();
            audio.init();
            level.init();
            HUD.init();

            // wait for google font
            $(document).on("fontLoaded", function () {
                // game timer
                setInterval(function () {
                    ++game.actualTime;
                }, 1000);

                // start the game
                game.start();


                //debug();
            });
        }
    }
})();

$(function () {
    // load font
    window.WebFontConfig = {
        google: {
            families: ['Press Start 2P']
        },
        active: function () {
            $(document).trigger("fontLoaded");
        },
        inactive: function () {
            alert("There was a problem loading a font from google, some text may not render correctly (refreshing the page may fix the issue).");
            $(document).trigger("fontLoaded");
        }
    };

    (function () {
        var wf = document.createElement("script");
        wf.src = "//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js";
        wf.type = "text/javascript";
        wf.async = "true";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(wf, s);
    })();


    Main.init();
});
