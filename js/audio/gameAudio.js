'use strict';

class GameAudio {
    constructor() {
        this.bgMusic = new Audio('audio/firstChiptune/firstChiptune.mp3');
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.7;
        this.bgMusic.pause();
        
        this.enemyDeath = new Audio('audio/death.mp3');
        this.enemyDeath.volume = 0.6;
        
        this.jump = new Audio('audio/jump.mp3');
        this.jump.volume = 0.4;

        this.thud = new Audio('audio/thud.mp3');
        this.thud.volume = 0.78;

        this.discovery = new Audio('audio/spell3.mp3');
        this.discovery.volume = 0.7;
        
        this.enterSound = new Audio('audio/synthetic_explosion_1.mp3');
        this.exitSound = new Audio('audio/annulet.mp3');
        this.itemPickedUp = new Audio('audio/life_pickup.mp3');
        this.heartbeat = new Audio('audio/heartbeat.mp3');
        this.step = new Audio('audio/step.mp3');
        this.effort = new Audio('audio/woosh.mp3');
        this.heroDeath = new Audio('audio/DiscsOfTron_Cascade.mp3');
        this.enchant = new Audio('audio/enchant.mp3');
        this.isOn = false;

        this.mute(true);
        $(document).on('click', '.audioState', () => {
            this.handleMuteButton();
        });
        
        document.querySelector('.menu').addEventListener('click', e => {
            e.preventDefault();
            utils.toggleMenu();
        });

        // enable audio on start
        //this.handleMuteButton();
    }

    lvlComplete() {
        this.bgMusic.pause();

        let newBgMusic;
        
        switch(game.lvl) {
            case 0:
                this.enterSound.play();
                return;
            default:
                this.exitSound.play();
                newBgMusic = 'sweetAcoustic.mp3';
                break;
        }

        setTimeout(() => {
            this.bgMusic = new Audio(`audio/${newBgMusic}`);
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.45;

            this.isOn ?
                this.bgMusic.play() :
                this.bgMusic.pause();
        }, 1000);
    }

    updateBgMusic() {
        this.bgMusic.pause();

        let newBgMusic;

        switch(game.lvl) {
            case 1:
            case 2:
                newBgMusic = 'inspiredBySparkMan/sparkBoy.mp3';
                break;
            case 3:
                newBgMusic = 'bossBeat/bossBeat.mp3';
                break;
            default:
                newBgMusic = 'sweetAcoustic.mp3';
                break;
        }

        setTimeout(() => {
            this.bgMusic = new Audio(`audio/${newBgMusic}`);
            this.bgMusic.loop = true;
            this.bgMusic.volume = 0.45;

            this.isOn ?
                this.bgMusic.play() :
                this.bgMusic.pause();
        }, 1000);
    }

    play(sound, stopPrev){
        stopPrev = (typeof(stopPrev) !== 'undefined') ? stopPrev : true;

        if(sound.ended) {
            sound.play();
        }
        else {
            if(stopPrev || sound.currentTime === 0) {
                sound.pause();
                sound.currentTime = 0;
                sound.play();
            }
        }
    }

    handleMuteButton() {
        let audioStates = Array.from(document.querySelectorAll('.audioState'));
        
        audioStates.forEach(audioState => {
            if(audioState.classList.contains('off')) {
                $('.audioState iron-icon').attr('icon', 'i:volume-up');
                audioState.classList.remove('off');
                audioState.classList.add('on');
                
                this.mute(false);
            }
            else {
                $('.audioState iron-icon').attr('icon', 'i:volume-off');
                audioState.classList.remove('on');
                audioState.classList.add('off');
    
                this.mute(true);
            }
        });
    }

    mute(onOrOff) {
        this.discovery.muted =
        this.enterSound.muted =
        this.bgMusic.muted =
        this.itemPickedUp.muted =
        this.heartbeat.muted =
        this.effort.muted = 
        this.thud.muted = 
        this.jump.muted = 
        this.step.muted = 
        this.enemyDeath.muted =
        this.heroDeath.muted =
        this.enchant.muted =
        this.exitSound.muted =
            onOrOff;

        onOrOff ?
            this.bgMusic.pause() :
            this.bgMusic.play();

        this.isOn = !onOrOff;
    }
}