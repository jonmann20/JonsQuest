const JQEnemy = Object.freeze({
    STILL: 0,
    PATROL: 1,
    FOLLOW: 2
});


/*
 * Enemy extends GameObj
 *
 * @param(GameObj) gObj A game object (super class).
 * @param(EnemyType) enemy_t The type of the enemy.
 * @param(number) health The hp of the enemy.
 * @param(number) leftXBound The left x coordinate boundary.
 * @param(number) rightXBound The right x coordinate boundary.
 * @param(bool?) active Is the enemy allowed to move?
 * @constructor
 */
var Enemy = function(gObj, enemy_t, health, leftXBound, rightXBound, active) {
    utils.extend(this, gObj);

    this.initX = this.pos.x;
    this.initY = this.pos.y;

    this.initHealth = this.health = health;
    this.enemy_t = enemy_t;
    this.leftXBound = leftXBound;
    this.rightXBound = rightXBound;
    this.active = (typeof (active) !== "undefined") ? active : false;
    this.deadOffScreen = false;

    // TODO: make private (and initHealth)
    this.dir = Dir.RIGHT;
    this.alive = true;
    this.deadOnScreen = false;
    this.clearDir = Dir.RIGHT;

    
    var that = this;
    
    // draw
    function drawHealth() {
        var healthLen = (that.w / that.initHealth) * that.health;

        ctx.fillStyle = "red";
        ctx.fillRect(that.pos.x, that.pos.y - 12, healthLen, 4);
    }

    var parentDraw = this.draw;
    this.draw = function () {
        if (this.alive || this.deadOnScreen) {
            if (this.initHealth > 1) {
                drawHealth();
            }

            ctx.save();
            if(this.deadOnScreen) {
                ctx.globalAlpha = 0.3;
            }

            parentDraw.apply(this);
            ctx.restore();
        }
    }
};

Enemy.prototype = {
    update: function() {
        if (this.deadOnScreen) {
            if(this.enemy_t === JQEnemy.STILL) {
                this.deadOnScreen = false;
                this.deadOffScreen = true;
            }
            else {
                this.pos.x += (this.clearDir === Dir.RIGHT) ? 2 : -2;
                this.pos.y -= 9;

                if(this.pos.x < 0 || this.pos.x > FULLW) {
                    this.deadOnScreen = false;
                    this.deadOffScreen = true;
                }
            }
        }
        else if (this.active && game.totalTicks % 3 === 0) {
            this.movement();
        }
    },

    // TODO: make private
    movement: function() {
        if(this.enemy_t === JQEnemy.PATROL) {
            if(this.pos.x + hero.lvlX <= this.leftXBound) {
                this.dir = Dir.RIGHT;
            }
            else if(this.pos.x + hero.lvlX >= this.rightXBound) {
                this.dir = Dir.LEFT;
            }

            if(this.dir === Dir.RIGHT) {
                ++this.pos.x;
            }
            else {
                --this.pos.x;
            }
        }
        else if(this.enemy_t === JQEnemy.FOLLOW) {
            if(this.pos.x < hero.pos.x) {
                ++this.pos.x;
            }
            else if(this.pos.x > hero.pos.x) {
                --this.pos.x;
            }
        }
    },

    death: function() {
        this.clearDir = hero.dir;

        audio.enemyDeath.play();
        hero.xp += 15;
        this.alive = false;
        this.deadOnScreen = true;
    },

    revive: function() {
        this.health = this.initHealth;
        this.deadOffScreen = false;
        this.deadOnScreen = false;
        this.alive = true;
    }
};