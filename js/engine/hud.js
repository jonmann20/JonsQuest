'use strict';

class Hud {
    constructor() {
        // HUD icons
        this.cash = new GameObj(JQObject.EMPTY, 548, FULLH + 20, 22, 24, 'cash.png');
        this.medKit = new GameObj(JQObject.EMPTY, 238, FULLH + 15, 31, 30, 'medKit.png');
        this.shuriken = new GameObj(JQObject.EMPTY, 447, FULLH + 15, 31, 31, 'shuriken.png');
        this.syringe = new GameObj(JQObject.EMPTY, 342, FULLH + 18, 25, 25, 'syringe.png');
    }

    drawHealth() {
        for(let i=0; i < hero.health; ++i) {
            ctx.fillStyle = 'red';
            ctx.fillRect(77 + i*21, FULLH + 8, 19, 8);
        }
    }
	
    drawMana() {
        for(let i=0; i < hero.mana; ++i) {
            ctx.fillStyle = '#00b6ff';
            ctx.fillRect(77 + i*21, FULLH + 26, 19, 8);
        }
    }
	
    drawXP() {
        ctx.fillStyle = '#ddd';
        ctx.font = '12px "Press Start 2P"';
        	
        const zero = (hero.xp < 10) ? '0' : '';
        ctx.fillText(`${zero}${hero.xp}/${hero.xpNeeded}`, 77, FULLH + 54);
    }

    draw() {// TODO: break out static parts
        // background
        ctx.fillStyle = '#070707';
        ctx.fillRect(0, FULLH, FULLW, game.padHUD);

        ctx.fillStyle = '#ddd';
        ctx.font = '11px "Press Start 2P"';

        ctx.fillText(`HP-${hero.healthLvl}`, 7, FULLH + 18);
        ctx.fillText(`MP-${hero.manaLvl}`, 7, FULLH + 37);
        ctx.fillText('XP', 7, FULLH + 54);
        
        this.drawHealth();
        this.drawMana();
        this.drawXP();

        // hp kit
        ctx.fillText(hero.medKits, 210, FULLH + 37);
        this.medKit.draw();

        // mp kit
        ctx.fillText(hero.manaKits, 315, FULLH + 37);
        this.syringe.draw();

        // ammo
        ctx.fillText(hero.ammo, 410, FULLH + 37);
        this.shuriken.draw();

        // money
        ctx.fillText(hero.cash, 515, FULLH + 37);
        this.cash.draw();

        // lives
        ctx.fillText(`LIVES x${hero.lives}`, 700, FULLH + 37);

        // time
        let time = utils.getTimeObj(game.actualTime);
        ctx.fillText(time.min + ':' + time.sec, FULLW - 78, FULLH + 24);
    }
}