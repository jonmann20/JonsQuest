var level = (() => {
    var maxVy = 10; // applys to GameObj's and GameItem's

    /********** Update **********/
    function updateObjsView() {
        for (var i = 0; i < level.objs.length; ++i) {
            level.objs[i].pos.x -= hero.vX;

            if(level.objs[i].type === JQObject.SCALEBG) {
                level.objs[i].x2 -= hero.vX;
            }

        }
    }

    function updateItemsView() {
        for (var i = 0; i < level.items.length; ++i) {
            level.items[i].pos.x -= hero.vX;
        }
    }

    function updateBgView() {
        // color layer
        level.bgColor.gradX -= hero.vX;
        level.bgColor.fillStyle = Graphics.getDoorBgGrad();

        // objects
        for (var i = 0; i < level.bg.length; ++i) {
            var dtX = hero.vX / level.bg[i].speed;
            level.bg[i].pos.x -= dtX;
            level.bg[i].distTraveled += dtX;
        }
    }

    function updateEnemiesView() {
        for (var i = 0; i < level.enemies.length; ++i) {
            level.enemies[i].pos.x -= hero.vX;
        }
    }


    function updateItems() {
        for (var i = 0; i < level.items.length; ++i) {
            if (level.items[i].visible && !level.items[i].isOnObj) {
                // gravity/position
                if (level.items[i].vY < maxVy)
                    level.items[i].vY += game.gravity;
                else
                    level.items[i].vY = maxVy;

                // obj collision
                Physics.testObjObjs(level.items[i], function(r) {
                    // a is level.items[i]
                    // b is in level.objs

                    r.a.pos.x -= r.overlapV.x;
                    r.a.pos.y -= r.overlapV.y;

                    if (r.overlapN.y === 1) {    // on top of platform
                        audio.thud.play();

                        r.a.vY = (r.b.type === JQObject.ELEVATOR) ? r.b.vY : 0;
                        r.a.isOnObj = true;
                        r.a.onObj = r.b;
                        r.a.recentlyHeld = false;

                        if(r.b.type === JQObject.SCALE && r.b.holdingItem === null) {
                            r.a.grabbable = false;
                            r.b.holdingItem = r.a;

                            utils.repeatAction(42, 14, function () {
                                if(r.b.side === Dir.LEFT) {
                                    ++r.a.pos.y;
                                    ++r.b.pos.y;

                                    ++r.b.hBar.pos.y;

                                    --r.b.otherSide.pos.y;
                                    --r.b.hBar.y2;

                                    if(r.b.otherSide.holdingItem !== null) {
                                        --r.b.otherSide.holdingItem.pos.y;
                                        // TODO: chain of crates on top
                                    }
                                }
                                else {
                                    ++r.a.pos.y;
                                    ++r.b.pos.y;

                                    ++r.b.hBar.y2;

                                    --r.b.hBar.pos.y;
                                    --r.b.otherSide.pos.y;

                                    if(r.b.otherSide.holdingItem !== null) {
                                        --r.b.otherSide.holdingItem.pos.y;
                                        // TODO: chain of crates on top
                                    }
                                }

                            });
                        }
                    }

                });

                // item collision
                Physics.testItemItems(level.items[i], function (r) {
                    r.a.isOnObj = true;
                    r.a.onObj = r.b;
                    r.b.grabbable = false;
                    r.a.recentlyHeld = false;
                });
            }

            if(typeof (level.items[i].onObj) !== "undefined" && level.items[i].onObj !== null) {
                level.items[i].vY = (level.items[i].onObj.type === JQObject.ELEVATOR) ? level.items[i].onObj.vY : 0;
            }

            level.items[i].pos.y += level.items[i].vY;
        }
    }

    function updateEnemies() {
        for (var i = 0; i < level.enemies.length; ++i) {
            level.enemies[i].update();

            // TODO: move to hero??

            if(level.enemies[i].health > 0) {
                // hero and enemy
                if(SAT.testPolygonPolygon(hero, level.enemies[i])) {
                    level.enemies[i].active = true;

                    if(!hero.invincible) {
                        audio.play(audio.heartbeat, true);

                        hero.invincible = true;
                        --hero.health;
                    }
                }

                // projectiles and enemy
                for (var j = 0; j < hero.bulletArr.length; ++j) {
                    if(SAT.testPolygonPolygon(hero.bulletArr[j], level.enemies[i])) {
                        audio.play(audio.thud, true);
                        level.enemies[i].active = true;

                        hero.bulletArr.splice(j, 1); // remove jth item
                        --level.enemies[i].health;

                        if (level.enemies[i].health <= 0) {
                            level.enemies[i].death();
                        }
                    }
                }
            }
        }
    }

    /********** Render **********/
    // the parallax background
    function drawBg() {
        // color background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, FULLH - game.padFloor, FULLW, game.padFloor);
        ctx.fillStyle = level.bgColor.fillStyle;
        ctx.fillRect(0, 0, FULLW, FULLH - game.padFloor);

        // background objects
        for (var i = 0; i < level.bg.length; ++i) {
            //level.bg[i].draw();
            var t = level.bg[i];
            var scale = utils.speed2scale(t.speed);

            ctx.drawImage(t.img, t.pos.x, t.pos.y, t.w * scale, t.h * scale);
        }
    }

    // all of the collision rectangles in the level
    function drawObjs() {
        for (var i = 0; i < level.objs.length; ++i) {
            var obj = level.objs[i];

            // check if visible; TODO: all objs should have visible property (fix api)
            if (typeof (obj.visible) !== "undefined" && !obj.visible) {
                continue;
            }
            

            if(obj.type === JQObject.LADDER) {           // ladder
                Graphics.drawLadder(obj);
            }
            else if(obj.type === JQObject.SCALE) {       // scale
                Graphics.drawScale(obj);
                Graphics.drawPlatformStatus(obj);
            }
            else if(obj.type === JQObject.PLATFORM || obj.type === JQObject.SLOPE || obj.type === JQObject.ELEVATOR) {
                Graphics.drawPlatform(obj);
            }
            else if(obj.type === JQObject.DOOR) {
                Graphics.drawDoor(obj);
            }
            else if(obj.type === JQObject.POLY) {
                Graphics.drawPoly(obj);
            }
            else if(obj.type === JQObject.HILL) {
                Graphics.drawHill(obj);
            }
            else {
                obj.draw();
            }
        }
    }

    function drawItems() {
        for (var i = 0; i < level.items.length; ++i) {
            level.items[i].draw();
        }
    }

    function drawEnemies() {
        for (var i = 0; i < level.enemies.length; ++i) {
            if (!level.enemies[i].deadOffScreen) {
                level.enemies[i].draw();
            }
        }
    }


    return {
        bgColor: {},
        bg: [],             // dynamically holds all of the background objects for the level
        objs: [],           // dynamically holds all of the objects for the level
        items: [],          // dynamically holds all of the items for the level
        enemies: [],        // dynamically holds all of the enemies for the level
        curLvl: null,       // alias for the current level object e.g. lvl1
        isCutscene: false,
        time: 0,
        hiddenItemsFound: 0,
        hiddenItems: 0,
        isTransitioning: false,
        

        init: () => {
            level.reset();
            level.curLvl = new StartScreen();     // level '0'
        },

        // called before start of level
        reset: function() {
            // reset game stats
            game.over = false;
            game.actualTime = 0;

            // reset level
            level.hiddenItemsFound = 0;
            hero.lvlX = 0;
            level.bgColor = {
                fillStyle: "#000"
            };
            level.bg = [];
            level.objs = [];
            level.items = [];
            level.enemies = [];

            // reset hero
            hero.pos.x = 23;
            hero.pos.y = FULLH - game.padFloor - hero.h + 4;    // TODO: find out '4' offset??
            hero.vX = hero.vY = 0;
            hero.isJumping = false;
            hero.ammo = 20;
            hero.bulletArr.length = 0;		// prevents leftover thrown shurikens
            hero.invincible = false;
            hero.isHolding = false;
            hero.curItem = null;
            hero.dir = Dir.RIGHT;
            hero.health = hero.maxHealth;
        },

        // called at end of level
        complete: function() {
            level.isTransitioning = true;
            audio.lvlComplete();

            // reset graphics timers (to fix blink text)
            Graphics.ticker = 1;
            Graphics.fadeOut = true;

            Graphics.fadeCanvas(function () {
                level.isTransitioning = false;
                level.curLvl = lvlComplete;
                level.isCutscene = true;
                level.time = game.actualTime;

                // TODO: audio.lvlCompleted.play()
            });
        },

        /******************** Update ********************/
        update: function() {
            if(!level.isTransitioning) {
                if(game.lvl != 0) {
                    updateItems();
                    updateEnemies();

                    // bg objects
                    var i = level.bg.length;
                    while(i--) {
                        var dtX = 0.5 / level.bg[i].speed;
                        level.bg[i].pos.x -= dtX;
                        level.bg[i].distTraveled += dtX;

                        if(level.bg[i].distTraveled > level.bg[i].distToTravel) {
                            level.bg.splice(i, 1);
                            Graphics.spawnCloud(level.curLvl.width);
                        }
                    }
                }

                level.curLvl.update();
            }
        },

        // fix positions relative to the "camera" view
        updateView: () => {
            updateObjsView();
            updateItemsView();
            updateBgView();
            updateEnemiesView();
        },


        /******************** Render ********************/
        render: () => {
            drawBg();
            drawObjs();
            drawItems();
            drawEnemies();
            
            level.curLvl.render();
        }
    };
})();