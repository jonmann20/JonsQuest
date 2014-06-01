/// <reference path="../linker.js" />

// The physics component of hero.
var HeroPhysicsComponent = function () {

    /*
        Updates projectiles position.

        Tests for projectile collision against screen.
        Tests for projectile collision against objects.
    */
    function projectileHandler() {
        for (var i = 0; i < hero.bulletArr.length; ++i) {
            hero.bulletArr[i].pos.x += hero.bulletArr[i].dirR ? Shuriken.speed : -Shuriken.speed;   // update position

            if (hero.bulletArr[i].pos.x > FULLW || hero.bulletArr[i].pos.x < 0) {		    // projectile and screen
                hero.bulletArr.splice(i, 1); // remove ith item
            }
            else {
                Physics.testObjObjs(hero.bulletArr[i], function(){                  // projectile and objects
                    hero.bulletArr.splice(i, 1);
                });
            }
        }
    }

    function screenCollision() {
        if (hero.pos.y < -hero.h*2) {                 // feet 2x above top of screen
            hero.pos.y = -hero.h*2;
            hero.vY = 0;
        }
        else if (hero.pos.y >= FULLH + hero.h*2) {  // 2x below bottom of screen
            if (!game.over) {
                utils.deathSequence();
            }
        }

        if (hero.pos.x < 0) { 						// left
            hero.pos.x = 0;
            hero.vX = 0;
        }
        else if (hero.pos.x > (FULLW - hero.w)) { 	// right 
            hero.pos.x = FULLW - hero.w;
            hero.vX = 0;
        }
    }

    function levelCollision() {
        hero.isOnObj = false;   // prevents jumping after walking off platform

        Physics.testObjObjs(hero, function(r) {
            // alias the collision direction
            var dir = {
                x: Dir.NONE,
                y: Dir.NONE
            };

            if(r.overlapN.y === 1)
                dir.y = Dir.TOP;
            else if(r.overlapN.y === -1)
                dir.y = Dir.BOT;

            if(r.overlapN.x === 1)
                dir.x = Dir.LEFT;
            else if(r.overlapN.y === -1)
                dir.x = Dir.RIGHT;


            // check object type
            if(r.b.type === JQObject.SLOPE || r.b.type === JQObject.POLY || r.b.type === JQObject.HILL) {
                //r.a.pos.x -= r.overlapV.x;

                if(hero.vY >= 0) { // prevents hooking on edge
                    hero.landed(r.overlapV.y);
                }
            }
            else if(r.b.type === JQObject.ELEVATOR) {
                if(dir.y === Dir.TOP && hero.vY >= 0) {
                    hero.isOnObj = true;
                    hero.isJumping = false;
                    hero.vY = (r.b.vY > 0) ? r.b.vY : 0;

                    r.a.pos.y -= r.overlapV.y;
                }
            }
            else {
                r.a.pos.x -= r.overlapV.x;

                if(dir.y === Dir.TOP && hero.vY >= 0) {  // prevents hooking on edge
                    hero.landed(r.overlapV.y);
                }
                else if(dir.y === Dir.BOT && hero.vY <= 0) {  // prevents hooking on edge
                    hero.vY = 0;
                    r.a.pos.y -= r.overlapV.y;
                }
            }
        });
        
        if (hero.isHolding) {
            if (hero.vX === 0) {
                hero.curItem.pos.x = hero.pos.x + 7;
                hero.curItem.pos.y = hero.pos.y + 20;
            }
            else {
                hero.curItem.pos.x = hero.pos.x + ((hero.dir === Dir.RIGHT) ? 45 : -32);
                hero.curItem.pos.y = hero.pos.y + 16;
            }
        }

        Physics.testHeroItems(function (r, idx) {
            if (r.b.type === JQObject.CRATE) {      // TODO: make more generic
                if (r.overlapN.y === 1) {           // on top
                    hero.pos.y -= r.overlapV.y;
                    hero.isOnObj = true;
                    hero.isJumping = false;

                    hero.vY = 0;

                    if(typeof (r.b.onObj) !== "undefined" && r.b.onObj !== null) {  // hero on crate on elevator
                        if(r.b.onObj.type === JQObject.ELEVATOR) {
                            hero.vY = r.b.vY;
                        }
                    }
                }
                else if (!hero.isHolding && r.b.grabbable && !r.b.recentlyHeld) {
                    if (r.b.isOnObj === true) {
                        r.b.isOnObj = false;

                        if (r.b.onObj !== null) {
                            r.b.onObj.grabbable = true;
                            r.b.onObj = null;
                        }
                    }

                    r.b.isBeingHeld = true;

                    hero.curItem = r.b;
                    hero.isHolding = true;

                    level.items.splice(idx, 1);
                }
            }
            else {
                audio.itemPickedUp.play();

                if (r.b.type === JQObject.SACK) {
                    hero.ammo += r.b.val;
                }
                else if (r.b.type === JQObject.CASH) {
                    hero.cash += r.b.val;
                }

                level.items.splice(idx, 1);
            }
        });
    }

    return {
        updatePosition: function (){	
            // TODO: buggy at edges, quickly changing direction incorrectly causes an updateView()
            
            if(((hero.dir === Dir.RIGHT && hero.pos.x >= (HALFW + 35)) ||
               (hero.dir === Dir.LEFT && hero.pos.x <= (HALFW - 45))) &&
               (hero.lvlX + hero.vX >= 0) &&
               (hero.lvlX + hero.vX <= level.curLvl.width - FULLW)
            ){
                hero.lvlX += hero.vX;

                // updateProjectileView
                for(var i = 0; i < hero.bulletArr.length; ++i) {
                    hero.bulletArr[i].pos.x -= hero.vX;
                }

                level.updateView();
            }
            else {
                hero.pos.x += hero.vX;
            }

            if (!hero.onLadder) {
                hero.pos.y += hero.vY;
            }
        },

        checkCollision: function () {
            projectileHandler();
            screenCollision();	    // hero and screen
            levelCollision();
        }
    };
};
