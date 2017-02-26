function Level3() {
    this.init();
}

Level3.prototype = (() => {
    var boss;

    function setBackground() {
        // color layer
        level.bgColor.gradX = 1400;
        level.bgColor.gradY = 180;
        level.bgColor.c0 = "#222";
        level.bgColor.c1 = "#333";

        var grad = ctx.createRadialGradient(
            level.bgColor.gradX,
            level.bgColor.gradY,
            14,
            level.bgColor.gradX,
            level.bgColor.gradY,
            440
        );

        grad.addColorStop(0, level.bgColor.c0);
        grad.addColorStop(1, level.bgColor.c1);
        level.bgColor.fillStyle = grad;

        // objects
        Graphics.setClouds(Level3.prototype.width);
    }

    function setObjects(){
        var floor = new GameObj(JQObject.PLATFORM, -Graphics.projectX, FULLH - game.padFloor, 1050, game.padFloor);
        level.objs.push(floor);
    }

    function setEnemies(){
        boss = new Enemy(
            new GameObj(JQObject.ENEMY, 400, FULLH - game.padFloor - 160, 120, 165, "cyborgBnW_boss.png"),
            JQEnemy.PATROL,
            1,
            200,
            500,
            true
        );

        boss.collidable = true;        // TODO: fix api
        level.enemies.push(boss);
    }

    return {
        width: 1008,


        init: function() {
            level.hiddenItems = 0;
            setObjects();
            //setItems();
            setEnemies();

            setBackground();
        },

        deinit: function() {

        },

        update: function() {

        },

        render: function() {
            ctx.fillStyle = "#fff";
            ctx.font = "22px 'Press Start 2P'";
            ctx.fillText("LEVEL 3 -- BOSS BATTLE COMING SOON!!", 150, 280);
        }
    };
})();