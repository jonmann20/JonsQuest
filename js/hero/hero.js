/// <reference path="../linker.js" />

var Shuriken = {
    w: 31,
    h: 31,
    speed: 4.4
};

// The hero object.  TODO: convert to be of GameObj type
var hero = (function () {
    var input = null,           // the hero input component
        graphics = null,        // the hero graphics component
        physics = null,         // the hero physics component
        imgReady = false,
		img = null,
		spriteArr = [],
		invincibleTimer = 170,
        invincibleTimer0 = 170
	;
	
		
	/*********************** Update ***********************/
    function checkHealth() {
        if (hero.invincible)
            --invincibleTimer;

        if (invincibleTimer <= 0) {
            hero.invincible = false;
            invincibleTimer = invincibleTimer0;
        }
        
        if (hero.health <= 0 && !game.over) {
            utils.deathSequence();
        }
    }

    function getSpritePos() {
		var pos = {x: 0, y: 0};
		
		if (hero.isHolding && hero.vX === 0) {
			pos = spriteArr["playerDown"];
		}
		else if (hero.onLadder) {               // TODO: check if holding crate (shouldn't be allowed on ladder)
		    pos = spriteArr["playerUp"];
		}
		else if (hero.dir === Dir.RIGHT || hero.dir === Dir.LEFT) {
		    var dirR = (hero.dir === Dir.RIGHT);
		    var theDir = "player" + (dirR ? "Right" : "Left");

		    if (dirR && hero.vX > 0 ||  // right
		        !dirR && hero.vX < 0    // left
            ) {
		        var runTimer = (game.totalTicks % 96);

		        if(!hero.isOnObj){
		            pos = spriteArr[theDir + "_Run1"];
		        }
                else if(Math.abs(hero.vX) <= hero.aX*10){
		            pos = spriteArr[theDir + "_Step"];
		        }
		        else if(runTimer >= 0 && runTimer < 24) {
		            pos = spriteArr[theDir + "_Run1"];

		            if(!hero.isJumping) {
		                audio.step.play();
		            }
		        }
		        else if (runTimer >= 24 && runTimer < 48) {
		            pos = spriteArr[theDir + "_Run2"];
		        }
		        else if(runTimer >= 48 && runTimer < 72){
		            pos = spriteArr[theDir + "_Run3"];

		            if(!hero.isJumping) {
		                audio.step.play();
		            }
		        }
		        else {
		            pos = spriteArr[theDir + "_Run2"];
		        }
			}
			else
				pos = spriteArr[theDir];
		}
		
        // idle animation
		if(!hero.onLadder && hero.vX === 0 && hero.vY === 0) {
		    ++hero.idleTime;
		}
		else {
		    hero.idleTime = 0;

		    if (hero.isHolding) {
		        hero.curItem.pos.y = hero.pos.y + 20;
		    }
		}

		if (hero.idleTime > 210) {
		    var foo = hero.idleTime % 200;
		    
		    if (foo >= 0 && foo <= 50 || foo > 100 && foo <= 150)
		        pos = spriteArr["playerDown"];
		    else if (foo > 50 && foo <= 100) {
		        pos = spriteArr["playerDown_breatheIn"];

		        if (hero.isHolding) {
		            hero.curItem.pos.y = hero.pos.y + 18;
		        }
		    }
		    else if (foo > 150 && foo <= 200) {
		        pos = spriteArr["playerDown_breatheOut"];

		        if (hero.isHolding) {
		            hero.curItem.pos.y = hero.pos.y + 22;
		        }
		    }
		}

        // invincible
		var inv = invincibleTimer % 40;
		
		if(hero.invincible && (inv >= 0 && inv <= 16)){
			pos = {x: -1, y: -1};
		}

		
		hero.sx = pos.x;
		hero.sy = pos.y;
	}
	
	/*********************** Render ***********************/
	function drawHero(){
	    if (imgReady && hero.sx >= 0 && hero.sy >= 0) {
		    ctx.drawImage(img, hero.sx, hero.sy, hero.w, hero.h, Math.round(hero.pos.x), Math.round(hero.pos.y), hero.w, hero.h);
    	}
	}
		
    // used to draw things over the hero
	function drawAfterHero() {
	    if (hero.isHolding) {
	        hero.curItem.draw();
	    }
	}
		
	return {
		sx: 0,				// sprite position
		sy: 0,
		lvlX: 0,			
		w: 48,
		h: 65,
		vX: 0,              // maxVx/maxVy are in heroInput.js
		vY: 0,
		aX: 0.17,
		aY: 0.82,
		jumpMod: 4,
		jumpMod0: 4,
        idleTime: 0,
		dir: Dir.RIGHT,
		onLadder: false,
		invincible: false,
		isJumping: false,
		isHolding: false,
		isOnObj: true,
		curItem: null,      // the item in hand
        lives: 3,
		health: 3,
		maxHealth: 3,
		medKits: 1,
		healthLvl: 1,
		mana: 0,
		maxMana: 4,
		manaKits: 1,
		manaLvl: 1,
		ammo: 20,
		cash: 0,
		lvl: 1,
		xp: 0,
		xpNeeded: 50,
		bulletArr: [],
		

		init: function(){
			img = new Image();
			img.onload = function () { imgReady = true; };
			img.src = "img/sprites/player/player.png";
			
			// grab texturePacker's sprite coords
			$.get("img/sprites/player/player.xml", function(xml){
				var wrap = $(xml).find("sprite");
				
				$(wrap).each(function(){
					var name = $(this).attr('n'),
						x = $(this).attr('x'),
						y = $(this).attr('y');
					
					name = name.substring(0, name.length-4);
					spriteArr[name] = {x: x, y: y};
				});
				
			});
			
			input = HeroInputComponent();
			physics = HeroPhysicsComponent();
			graphics = HeroGraphicsComponent();

            // setup hero bounding box for collision detection
			$.extend(hero, new SAT.Box(new SAT.Vector(0, 0), hero.w, hero.h).toPolygon());
		},
		
		update: function () {
		    input.check();                      // updates velocities
			physics.updatePosition();          // updates positions
			physics.checkCollision();          // fix positions

			checkHealth();
			getSpritePos();
		},
	
		render: function () {
		    drawHero();
		    graphics.drawBullets();
		    drawAfterHero();
		},

		landed: function(y) {
		    hero.isOnObj = true;
		    hero.isJumping = false;
		    hero.vY = 0;
		    hero.pos.y -= y;
		}
	};
})();
