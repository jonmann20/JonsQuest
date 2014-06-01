var audio = (function () {

    return {
        bgMusic: new Audio("audio/firstChiptune/firstChiptune.mp3"),
        enterSound: new Audio("audio/synthetic_explosion_1.mp3"),
        exitSound: new Audio("audio/annulet.mp3"),
        itemPickedUp: new Audio("audio/life_pickup.mp3"),
        heartbeat: new Audio("audio/heartbeat.mp3"),
        jump: new Audio("audio/jump.mp3"),
        thud: new Audio("audio/thud.mp3"),
        step: new Audio("audio/step.mp3"),
        effort: new Audio("audio/woosh.mp3"),
        discovery: new Audio("audio/spell3.mp3"),
        enemyDeath: new Audio("audio/death.mp3"),
        heroDeath: new Audio("audio/DiscsOfTron_Cascade.mp3"),
        enchant: new Audio("audio/enchant.mp3"),
        isOn: false,


        init: function(){
            audio.bgMusic.loop = true;
            audio.bgMusic.volume = 0.7;
            audio.bgMusic.pause();

            audio.enemyDeath.volume = 0.6;
            audio.jump.volume = 0.4;
            audio.thud.volume = 0.78;
            audio.discovery.volume = 0.7;

            audio.mute(true);
            $(document).on("click", ".audioState", audio.handleMuteButton);

            $(".menu").on("click", function (e) {
                e.preventDefault();
                utils.toggleMenu();
            })

            //----- enable audio on start -----
            audio.handleMuteButton()
        },

        lvlComplete: function () {
            audio.bgMusic.pause();

            var newBgMusic;
            
            switch(game.lvl) {
                case 0:
                    audio.enterSound.play();
                    newBgMusic = "inspiredBySparkMan/sparkBoy.mp3";
                    break;
                default:
                    audio.exitSound.play();
                    newBgMusic = "sweetAcoustic.mp3";
                    break;
            }

            setTimeout(function () {
                audio.bgMusic = new Audio("audio/" + newBgMusic);
                audio.bgMusic.loop = true;
                audio.bgMusic.volume = 0.45;

                audio.isOn ?
                    audio.bgMusic.play() :
                    audio.bgMusic.pause();
            }, 1000);
        },

        play: function (sound, stopPrev) {
            stopPrev = (typeof (stopPrev) !== "undefined") ? stopPrev : true;

            if (sound.ended)
                sound.play();
            else {
                if (stopPrev || sound.currentTime === 0) {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.play();
                }
            }
        },

        handleMuteButton: function () {
            if ($('.audioState').hasClass('off')) {
                $('.audioState span').removeClass('icon-volume-mute').addClass('icon-volume-medium');
                $('.audioState').removeClass('off');
                $('.audioState').addClass('on');

                audio.mute(false);
            }
            else {
                $('.audioState span').removeClass('icon-volume-medium').addClass('icon-volume-mute');
                $('.audioState').removeClass('on');
                $('.audioState').addClass('off');

                audio.mute(true);
            }
        },

        mute: function (onOrOff) {
            audio.discovery.muted =
            audio.enterSound.muted =
            audio.bgMusic.muted =
            audio.itemPickedUp.muted =
            audio.heartbeat.muted =
            audio.effort.muted = 
            audio.thud.muted = 
            audio.jump.muted = 
            audio.step.muted = 
            audio.enemyDeath.muted =
            audio.heroDeath.muted =
            audio.enchant.muted =
            audio.exitSound.muted =
                onOrOff;

            onOrOff ?
                audio.bgMusic.pause() :
                audio.bgMusic.play();

            audio.isOn = !onOrOff;
        }
    };
})();
