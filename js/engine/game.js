/// <reference path="../linker.js" />

var game = (function () {
	var	avgFPS = 0,
        renderTimePrev = 0,
        renderTimeBtw = 16,
		fpsHistory = [60],
        updateFpsHistory = [120],
        updateTimePrev = 0,
        updateTimeBtw = 8,
        //lag = 0,
        renderLoop,
        updateLoop
	;
	
	function update() {
//	    var updateTimeCur = new Date().getTime();

//	    // timers
//	    if((updateTimeCur - updateTimePrev) > 0) {
//	        updateTimeBtw = updateTimeCur - updateTimePrev;
////	        console.log(updateTimeBtw);
//	    }
//	    updateTimePrev = updateTimeCur;


	    if (!level.isCutscene && !level.isTransitioning && !game.over) {
	        hero.update();
	    }

		level.update();
	}
	
	function render(renderTimeCur) {
        // timers
	    if ((renderTimeCur - renderTimePrev) > 0) {
	        renderTimeBtw = renderTimeCur - renderTimePrev;
	    }
	    renderTimePrev = renderTimeCur;


	    renderLoop = requestAnimFrame(render);

        
	    // drawing
	    level.render();

	    if (!level.isCutscene) {
            if(!game.over)
                hero.render();

	        HUD.draw();
	        drawFPS();
	    }
	}
	
	function drawFPS(fps) {
	    fpsHistory.push(1000 / renderTimeBtw);
	    
    	if (game.totalTicks % 120 === 0) {
    	    var tot = 0,
                i = fpsHistory.length
    	    ;
    	    
    	    while (--i) {
        		tot += fpsHistory[i];
        	}
    	    
    	    if (fpsHistory.length > 0) {
    	        avgFPS = Math.floor(tot / fpsHistory.length);
    	    }
    	    else {
    	        avgFPS = 0;
    	    }

    	    while (fpsHistory.length > 0) {
    	        fpsHistory.pop();
    	    }
        }
    	
    	ctx.fillStyle = "#ddd";
    	ctx.font = "11px 'Press Start 2P'";
	  	ctx.fillText(avgFPS + " FPS", FULLW - 77, FULLH + 50);
	}
   	

	return {
        over: false,        // indicates the game is finished
	    gravity: 0.13,
	    padHUD: 58,
	    padFloor: 16,
	    lvl: 0,
	    totalTicks: 0,      // ticks are update iterations
	    actualTime: 0,


	    start: function () {
            // update at fixed time interval
	        updateLoop = setInterval(function () {
	            ++game.totalTicks;
	            Graphics.ticker += Graphics.fadeOut ? -Graphics.tickerStep : Graphics.tickerStep;

	            //var updateTimeCur = new Date().getTime();

	            //if ((updateTimeCur - updateTimePrev) > 0) {
	            //game.updateTimeBtw = updateTimeCur - updateTimePrev;
	            //}

	            //updateTimePrev = updateTimeCur;
	            //lag += game.updateTimeBtw;

	            //while (lag >= game.updateTimeBtw) {      // TODO: interpolate if needed
	            update();
	            //lag -= game.updateTimeBtw;
	            //}
	        }, 8.3333); // 1000 / 120 ==> 2x target rate of 60fps
	        
            // render w/vsync (let browser decide)
	        render();
	    },

	    stop: function () {
	        window.cancelAnimationFrame(renderLoop);
	        clearInterval(updateLoop);
	    }
	};
})();
