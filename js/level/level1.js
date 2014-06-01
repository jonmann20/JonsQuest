/// <reference path="../linker.js" />

var lvl1 = (function () {

    var hiddenCash,
		door,
        ladder,
        doLadder = false,
        theScale = {}
    ;

    function setBackground() {
        //---- color layer
        level.bgColor.gradX = door.pos.x + door.w/2;
        level.bgColor.gradY = door.pos.y + door.h/2;

        level.bgColor.fillStyle = Graphics.getDoorBgGrad();

        //---- objects
        Graphics.setClouds();
    }

    function setObjs() {
        // floor + 3 initial platforms
        level.objs.push(
            new GameObj(JQObject.PLATFORM, -Graphics.projectX, FULLH - game.padFloor - 1, lvl1.width + Graphics.projectX * 2, game.padFloor + 1),
            new GameObj(JQObject.PLATFORM, 200, 206, 267, 62),
            new GameObj(JQObject.PLATFORM, 575, 310, 300, 62),
            new GameObj(JQObject.PLATFORM, 605, 125, 220, 62)
        );

        // scales
        theScale = Graphics.getScale(1500, FULLH - game.padFloor - 137);
        level.objs.push(theScale.vBar, theScale.hBar, theScale[Dir.LEFT], theScale[Dir.RIGHT]);


        // stairs, platform, and door
        var stairs = new GameObj(JQObject.SLOPE, 2143, 208, 252, 62, null, Dir.UP_RIGHT);
        var doorPlat = new GameObj(JQObject.PLATFORM, stairs.pos.x + stairs.w - 11, stairs.pos.y - stairs.h - 5, 200, 62);
        door = new GameObj(JQObject.DOOR, doorPlat.pos.x + doorPlat.w - 63, doorPlat.pos.y - 62 - Graphics.projectY / 2, 33, 62);
        level.objs.push(doorPlat, stairs, door);

        // TODO: move to setItems() ??
        ladder = new GameItem(new GameObj(JQObject.LADDER, stairs.pos.x - 37, stairs.pos.y - 1, 38, FULLH - stairs.pos.y - game.padFloor), false, 0, false);
        ladder.collidable = false;      // allows ladder to not be in normal collision detection
        level.objs.push(ladder);

    }

    function setItems() {        // crates        var crate = [];        for (var i = 0; i < 3; ++i) {
            crate.push(
                new GameItem(
                    new GameObj(JQObject.CRATE, 446, FULLH - game.padFloor - 26 + 5, 34, 37, "crate.png"),
                    true
                )
            );
        }
        crate[1].pos.x = theScale[Dir.LEFT].pos.x + theScale[Dir.LEFT].w / 2 - crate[0].w / 2;
        crate[2].pos.x = theScale[Dir.RIGHT].pos.x + theScale[Dir.RIGHT].w / 2 - crate[0].w / 2;        // sack
        var sack = new GameItem(new GameObj(JQObject.SACK, 680, 111 + Graphics.projectY / 2, 30, 34, "sack.png"), false, 5);

        // hidden cash; TODO: only add to level.items after visible???
        hiddenCash = new GameItem(new GameObj(JQObject.CASH, 113, 80, 22, 24, "cash.png"), false, 10, false);

        level.items.push(crate[0], crate[1], crate[2], sack, hiddenCash);
    }

    function setEnemies() {
        var cyborg = new Enemy(
            new GameObj(JQObject.ENEMY, 1200, FULLH - game.padFloor - 55 + Graphics.projectY/2, 40, 55, "cyborgBnW.png"),
            JQEnemy.FOLLOW,
            1,
            1087,
            1600,
            false
        );
        cyborg.collidable = false;  // TODO: fix api        level.enemies.push(cyborg);
    }


    return {
        width: 2650,


        init: function () {
            level.hiddenItems = 1;
            setObjs();            setItems();
            setEnemies();

            setBackground();
        },

        deinit: function(){
            hiddenCash = null;
            door = null;
            ladder = null;
            doLadder = false;
        },

        update: function () {
            // TODO: move to better location
            if (window.DEBUG) {
                level.complete();
            }

            if(doLadder) {
                hero.onLadder = SAT.testPolygonPolygon(hero, ladder);
            }
            else {
                doLadder = Physics.handleScale();
            }

            // hidden cash
            if (!hiddenCash.visible) {
                for (var i = 0; i < hero.bulletArr.length; ++i) {
                    if (Physics.isCollision(hero.bulletArr[i], hiddenCash, -17)) {
                        hiddenCash.visible = true;
                        audio.discovery.play();
                        ++level.hiddenItemsFound;
                    }
                }
            }

            // door
            if (!game.over && Physics.isCollision(hero, door, 0)) {     // TODO: why checking game.over???
                level.complete();
            }
        },

        render: function() {
            Graphics.drawScaleBg(theScale);
        }
    };

})();
