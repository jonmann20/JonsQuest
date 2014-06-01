/// <reference path="../linker.js" />

var lvl2 = (function () {

    var floor1,
        hill,
        floorPlat,
        colL,
        colR,
        bridge,
        elevator = [],
        wall,
        slope,
        ladder,
        door,
        enemy2hotspot,
        enemy2,
        fireball = null,
        theScale = {},
        doRevive = false,
        doLadder = false
    ;


    function setBackground() {
        level.bgColor.gradX = door.pos.x;
        level.bgColor.gradY = door.pos.y;

        level.bgColor.fillStyle = Graphics.getDoorBgGrad();
        Graphics.setClouds();
    }

    function setObjs() {
        floor1 = new GameObj(JQObject.PLATFORM, -Graphics.projectX, FULLH - game.padFloor, FULLW - 250, game.padFloor);
        hill = new GameObj(JQObject.HILL, 200, FULLH - game.padFloor, 320, 60);
        floorPlat = new GameObj(JQObject.PLATFORM, floor1.pos.x + floor1.w - Graphics.projectX, floor1.pos.y - floor1.h - 30, 1000, 180);
        colL = new GameObj(JQObject.PLATFORM, floorPlat.pos.x + 240, floorPlat.pos.y - 90 + Graphics.projectY, 100, 85);
        colR = new GameObj(JQObject.PLATFORM, floorPlat.pos.x + floorPlat.w - 100, floorPlat.pos.y - 90 + Graphics.projectY, 100, 85);
        bridge = new GameObj(JQObject.PLATFORM, colL.pos.x + 140, colL.pos.y - 137, 480, 30);

        level.objs.push(floorPlat, floor1, hill,colL, colR, bridge);

        // elevators
        for(var i = 0; i < 3; ++i) {
            elevator[i] = new GameObj(JQObject.ELEVATOR, colR.pos.x + 237 + i * 300, colR.pos.y - i*80, 115, 26);
            elevator[i].dir = Dir.DOWN;
            level.objs.push(elevator[i]);
        }

        wall = new GameObj(JQObject.PLATFORM, elevator[2].pos.x + elevator[2].w + 120, 190, 100, FULLH - 190);
        slope = new GameObj(JQObject.SLOPE, wall.pos.x + wall.w - Graphics.projectX, wall.pos.y, 900, FULLH - 190, null, Dir.DOWN_RIGHT);
        
        var platty = new GameObj(JQObject.PLATFORM, slope.pos.x + slope.w - Graphics.projectX - 1, FULLH - game.padFloor, 1000, game.padFloor);

        theScale = Graphics.getScale(platty.pos.x + 250, FULLH - game.padFloor - 137);
        level.objs.push(theScale.hBar, theScale.vBar, theScale[Dir.LEFT], theScale[Dir.RIGHT]);

        ladder = new GameObj(JQObject.LADDER, platty.pos.x + platty.w - Graphics.projectX - 30, 140, 30, FULLH - 140 - game.padFloor);
        ladder.visible = false;
        ladder.collidable = false;

        var platty2 = new GameObj(JQObject.PLATFORM, ladder.pos.x + ladder.w, 140, 350, game.padFloor);

        door = new GameObj(JQObject.DOOR, platty2.pos.x + platty2.w - 90, platty2.pos.y - 100, 40, 100);

        level.objs.push(platty, slope, wall, platty2, door, ladder);
    }

    function setItems() {
        var crate = new GameItem(new GameObj(JQObject.CRATE, bridge.pos.x + bridge.w / 2 - 80, bridge.pos.y - 37, 34, 37, "crate.png"), true);
        var crate2 = new GameItem(new GameObj(JQObject.CRATE, bridge.pos.x + bridge.w / 2 + 80, bridge.pos.y - 37, 34, 37, "crate.png"), true);
                    
        var sack = new GameItem(
            new GameObj(JQObject.SACK, colL.pos.x + 300, 302, 30, 36, "sack.png"),
            true,
            5
        );

        level.items.push(sack, crate, crate2);
    }

    function setEnemies() {
        var enemy = new Enemy(
            new GameObj(JQObject.ENEMY, colL.pos.x + colL.w, 404, 40, 55, "cyborgBnW.png"),
            JQEnemy.PATROL,
            1,
            colL.pos.x + colL.w,
            colR.pos.x - 55/2,
            true
        );
        enemy.collidable = true;        // TODO: fix api
        level.enemies.push(enemy);

        enemy2 = getEnemy2();

        enemy2hotspot = new GameObj(JQObject.EMPTY, enemy2.pos.x, enemy2.pos.y, enemy2.w, enemy2.h);
        enemy2hotspot.collidable = false;
        enemy2hotspot.visible = false;
        level.objs.push(enemy2hotspot);

        level.enemies.push(enemy2);
    }

    function getEnemy2() {
        en = new Enemy(
            new GameObj(JQObject.ENEMY, wall.pos.x + 35, wall.pos.y - 55, 40, 55, "cyborgBnW.png"),
            //new GameObj(JQObject.ENEMY, 135, FULLH - game.padFloor - 55, 40, 55, "cyborgBnW.png"),
            JQEnemy.STILL,
            5
        );
        en.collidable = true;

        return en;
    }

    function handleFireball() {
        // enemy2hotspot
        if((enemy2hotspot.pos.x + enemy2hotspot.w) >= 0 && (enemy2hotspot.pos.x + enemy2hotspot.w) <= FULLW) {
            // revive enemy2
            if(doRevive) {
                doRevive = false;
                enemy2.revive();
            }

            // shoot fireball
            if(enemy2.alive && fireball === null) {
                var dir;
                
                if(hero.pos.x < enemy2.pos.x)
                    dir = Dir.LEFT;
                else
                    dir = Dir.RIGHT

                fireball = new GameObj(JQObject.FIREBALL, enemy2.pos.x, enemy2.pos.y, 20, 20, null, dir);
                fireball.tag = level.objs.length;
                fireball.collidable = false;
                level.objs.push(fireball);
            }
        }
        else if(!enemy2.alive){
            doRevive = true;
        }

        // update position
        if(fireball !== null) {
            if(fireball.dir === Dir.LEFT) {
                --fireball.pos.x;
            }
            else {
                ++fireball.pos.x;
            }

            if(fireball.pos.x <= 0 || fireball.pos.x >= FULLW) {
                level.objs.splice(fireball.tag, 1);
                fireball = null;
            }
        }

        // test collision
        if(!hero.invincible && fireball !== null && SAT.testPolygonPolygon(hero, fireball)) {
            level.objs.splice(fireball.tag, 1);
            fireball = null;
            audio.play(audio.heartbeat, true);

            hero.invincible = true;
            --hero.health;
        }
    }

    return {
        width: 5030,


        init: function () {
            level.hiddenItems = 0;

            setObjs();
            setItems();
            setEnemies();

            setBackground();
        },

        deinit: function(){
            doLadder = false;
        },

        update: function() {
            // elevators
            for(var i = 0; i < elevator.length; ++i) {
                if(elevator[i].dir === Dir.UP && elevator[i].pos.y < 100) {
                    elevator[i].dir = Dir.DOWN;
                }
                else if(elevator[i].dir === Dir.DOWN && elevator[i].pos.y > 400) {
                    elevator[i].dir = Dir.UP;
                }

                elevator[i].vY = (elevator[i].dir === Dir.DOWN) ? 1 : -1;   // used by hero
                elevator[i].pos.y += elevator[i].vY;
            }
            
            // fireball
            handleFireball();

            // ladder
            if(doLadder) {
                hero.onLadder = SAT.testPolygonPolygon(hero, ladder);
            }
            else {
                doLadder = Physics.handleScale();
            }

            // door
            if(SAT.testPolygonPolygon(hero, door)) {
                level.complete();
            }
        },

        render: function() {
            Graphics.drawScaleBg(theScale);
        }
    };
})();