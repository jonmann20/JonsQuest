/// <reference path="../linker.js" />

function Level3() {
    this.init();
}

Level3.prototype = (function() {

    function setObjects(){
        var floor = new GameObj(JQObject.FLOOR, -Graphics.projectX, FULLH - game.padFloor, 1000, game.padFloor);
        level.objs.push(floor);
    }

    return {
        width: 2400,


        init: function() {
            level.hiddenItems = 0;

            setObjects();
            //setItems();
            //setEnemies();

            //setBackground();
        },

        deinit: function() {

        },

        update: function() {

        },

        render: function() {
            ctx.fillStyle = "#fff";
            ctx.fillText("LEVEL 3 -- COMING SOON", 300, 300);
            
        }
    };
})();
