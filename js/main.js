'use strict';

class Main {
    constructor() {
        this.setCanvasGlobals();
        this.loadingScreen();

        hero.init();
        window.audio = new GameAudio();
        level.init();
        window.HUD = new Hud();
    }
    
    // wait for google font
    onFontLoaded() {
        // game timer
        setInterval(() => {
            ++game.actualTime;
        }, 1000);

        // start the game
        game.start();

        //this.debug();
    }
    
    setCanvasGlobals() {
        window.canvas = document.querySelector('canvas');
        window.ctx = canvas.getContext('2d');
        
        window.FULLW = canvas.width;
        window.FULLH = canvas.height - game.padHUD;
        window.HALFW = FULLW / 2;
        window.HALFH = FULLH / 2;
    }

    loadingScreen() {
        ctx.fillStyle = '#e1e1e1';
        ctx.font = '25px "Press Start 2P"';
        ctx.fillText('LOADING...', HALFW - 80, HALFH + 20);
    }

    debug() {
        // dev enviroment
        if(location.hostname === 'jons-quest-jonmann20.c9users.io') {
            window.DEBUG = true;
            window.DEBUG_OPT = {
                'lvl': 3
            };

            // speed up canvas transition
            canvas.style.transition = 'opacity 0.01s';
            
            // skip start screen
            lastKeyDown = KeyCode.ENTER;

            // mute audio
            //audio.handleMuteButton();
        }
    }
}

$(() => {
    let main = new Main();
    
    // load font
    window.WebFontConfig = {
        google: {
            families: ['Press Start 2P']
        },
        
        active: function() {
            main.onFontLoaded();
        },
        
        inactive: function() {
            alert('There was a problem loading a font from google, some text may not render correctly (refreshing the page may fix the issue).');
            main.onFontLoaded();
        }
    };

    (() => {
        let wf = document.createElement('script');
        wf.src = 'https://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
        wf.type = 'text/javascript';
        wf.async = 'true';
        let s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(wf, s);
    })();
});