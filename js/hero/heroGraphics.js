/// <reference path="../linker.js" />

/*
    The graphics component of hero.
*/
var HeroGraphicsComponent = function () {

    var shurikenReady = false,
        shuriken = new Image()
    ;

    shuriken.src = "img/shuriken.png";
    shuriken.onload = function () {
        shurikenReady = true;
    };

    return {
        drawBullets: function(){
		    for(var i=0; i < hero.bulletArr.length; ++i){
		        var dirOffset = hero.bulletArr[i].dirR ?
    							    hero.w : 
    							    0;
	            
		        hero.bulletArr[i].deg += 5;
            
		        if (shurikenReady) {
		            Graphics.drawRotate(
                        shuriken,
                        hero.bulletArr[i].pos.x + dirOffset,
                        hero.bulletArr[i].pos.y + 20,
                        hero.bulletArr[i].deg
                    );
		        }
		    }
        }
    };
};
