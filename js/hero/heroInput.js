/// <reference path="../linker.js" />

var KeyCode = Object.freeze({
    ENTER: 13,
    CTRL: 17,
    A: 65,
    D: 68,
    F: 70,
    H: 72,
    J: 74,
    K: 75,
    M: 77,
    O: 79,
    R: 82,
    S: 83,
    W: 87,
    EMPTY: -1,
    SPACEBAR: 32
});

// The input component of hero.
var HeroInputComponent = function () {

    var maxVx = 3,
        maxVy = 10
    ;

    // global key vars
    keysDown = {};
    lastKeyDown = -1;

    $(document).on("click", ".resize", function () {
        if ($(this).hasClass("off")) {
            $(this).removeClass("off").addClass("on");
            $(this).children("span").removeClass("icon-expand").addClass("icon-contract");
        }
        else if ($(this).hasClass("on")) {
            $(this).removeClass("on").addClass("off");
            $(this).children("span").removeClass("icon-contract").addClass("icon-expand");
        }

        utils.toggleFullScreen();
    });

    addEventListener("keydown", function (e) {
        if (e.keyCode === KeyCode.SPACEBAR)
            e.preventDefault(); 			    // scrolling to bottom of page
        else if (e.keyCode === KeyCode.M)	    // mute/unmute
            audio.handleMuteButton();
        else if (e.keyCode === KeyCode.F)        // resize
            $(".resize").trigger("click");
        else if (e.keyCode === KeyCode.K &&		// jump; TODO: move to check() function
               (!hero.isJumping && ((lastKeyDown !== KeyCode.K) || !(keysDown[KeyCode.K]))) &&
               hero.isOnObj
        ) {
            audio.jump.play();
            hero.vY = 0;
            hero.isJumping = true;
            hero.isOnObj = false;
        }
        else if (e.keyCode === KeyCode.J &&		// shoot; TODO: move to check() function
                ((lastKeyDown != KeyCode.J) || !(keysDown[KeyCode.J]))
        ) {
            if (hero.ammo > 0 && !hero.isHolding) {
                audio.play(audio.effort);

                var projectile = new GameObj(JQObject.SHURIKEN, hero.pos.x, hero.pos.y + Shuriken.h/2, Shuriken.w, Shuriken.h);
                projectile.dirR = (hero.dir === Dir.RIGHT);
                projectile.deg = 0;

                hero.bulletArr.push(projectile);

                --hero.ammo;
                hero.idleTime = 0;
            }
        }
        else if (e.keyCode == KeyCode.O) {      // options
            utils.toggleMenu();
        }

        lastKeyDown = e.keyCode;
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);


    return {
        check: function () {
            var doGravity = false;

            // jumping
            if (hero.isJumping) {
                if (hero.jumpMod > 0) {
                    hero.vY -= hero.aY * hero.jumpMod--;
                }
                else {
                    doGravity = true;
                }
            }
            else {
                hero.jumpMod = hero.jumpMod0;
                doGravity = true;
            }

            if (doGravity && !hero.onLadder) {
                var fixVy = hero.vY + game.gravity*2;

                if (fixVy > maxVy) {
                    hero.vY = maxVy;
                }
                else {
                    hero.vY = fixVy;
                }
            }


            // --------- keys pressed --------
            var leftOrRight = false;
            // left
            if(keysDown[KeyCode.A]){
                hero.vX = (Math.abs(hero.vX - hero.aX) > maxVx) ? -maxVx : (hero.vX - hero.aX);
                hero.dir = Dir.LEFT;
                leftOrRight = true;
            }

            // right
            if (keysDown[KeyCode.D]) {
                hero.vX = (Math.abs(hero.vX + hero.aX) > maxVx) ? maxVx : (hero.vX + hero.aX);
                hero.dir = Dir.RIGHT;
                leftOrRight = true;
            }
	    
            if(Math.abs(hero.vX) < hero.aX){    
                hero.vX = 0;
            }
            else if(!leftOrRight){
                //hero.vX += (hero.vX > 0) ? -game.friction : game.friction;
                hero.vX /= 1.26;
            }
	    

            // up
            if (keysDown[KeyCode.W]) {
                if (hero.onLadder) {
                    --hero.pos.y;
                }
            }

            // down
            if (keysDown[KeyCode.S]) {
                if (hero.onLadder) {
                    ++hero.pos.y;
                }
            }

	    
            // drop 
            if (keysDown[KeyCode.SPACEBAR]) {
                if (hero.isHolding) {
                    hero.isHolding = false;
                    hero.curItem.isBeingHeld = false;
                    hero.curItem.recentlyHeld = true;       // TODO: fix api
                    level.items.push(hero.curItem);
                    hero.curItem = null;
                }
            }

		
            //----- heal (h)
            if(keysDown[KeyCode.H]){
                if(hero.medKits > 0 && hero.health < hero.maxHealth){
                    ++hero.health;
                    --hero.medKits;

                    audio.play(audio.enchant, true);
                }
            }
		
		
            // restore
            if(keysDown[KeyCode.R] && !(keysDown[KeyCode.CTRL])){
                if(hero.manaKits > 0 && hero.mana < hero.maxMana){
                    ++hero.mana;
                    --hero.manaKits;

                    audio.play(audio.enchant, true);
                }
            }
		
        }
    };
};
