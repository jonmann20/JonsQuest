/// <reference path="../linker.js" />

var HUD = (function () {

    var cash = null,
        medKit = null,
        shuriken = null,
        syringe = null
    ;


    function drawHealth(){
        for(var i=0; i < hero.health; ++i){
            ctx.fillStyle = "red";
            ctx.fillRect(77 + i*21, FULLH + 8, 19, 8);
        }
    }
	
    function drawMana(){
        for(var i=0; i < hero.mana; ++i){
            ctx.fillStyle = "#00b6ff";
            ctx.fillRect(77 + i*21, FULLH + 26, 19, 8);
        }
    }
	
    function drawXP() {
        ctx.fillStyle = "#ddd";
        ctx.font = "12px 'Press Start 2P'";
        	
        var zero = (hero.xp < 10) ? '0' : '';
        ctx.fillText(zero + hero.xp + '/' + hero.xpNeeded, 77, FULLH + 54);
    }


    return {
        init: function () {
            // HUD icons
            cash = new GameObj(JQObject.EMPTY, 548, FULLH + 20, 22, 24, "cash.png");
            medKit = new GameObj(JQObject.EMPTY, 238, FULLH + 15, 31, 30, "medKit.png");
            shuriken = new GameObj(JQObject.EMPTY, 447, FULLH + 15, 31, 31, "shuriken.png");
            syringe = new GameObj(JQObject.EMPTY, 342, FULLH + 18, 25, 25, "syringe.png");
        },

        draw: function () {// TODO: break out static parts
            // background
            ctx.fillStyle = "#070707";
            ctx.fillRect(0, FULLH, FULLW, game.padHUD);

            ctx.fillStyle = "#ddd";
            ctx.font = "11px 'Press Start 2P'";


            ctx.fillText("HP-" + hero.healthLvl, 7, FULLH + 18);
            ctx.fillText("MP-" + hero.manaLvl, 7, FULLH + 37);
            ctx.fillText("XP", 7, FULLH + 54);
            
            drawHealth();
            drawMana();
            drawXP();

            // hp kit
            ctx.fillText(hero.medKits, 210, FULLH + 37);
            medKit.draw();

            // mp kit
            ctx.fillText(hero.manaKits, 315, FULLH + 37);
            syringe.draw();

            // ammo
            ctx.fillText(hero.ammo, 410, FULLH + 37);
            shuriken.draw();

            // money
            ctx.fillText(hero.cash, 515, FULLH + 37);
            cash.draw();

            // lives
            ctx.fillText("LIVES x" + hero.lives, 700, FULLH + 37);

            // time
            var time = utils.getTimeObj(game.actualTime);
            ctx.fillText(time.min + ':' + time.sec, FULLW - 78, FULLH + 24);
        }
    };
})();
