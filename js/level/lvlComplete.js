/// <reference path="../linker.js" />

var lvlComplete = (function () {

    return {
        update: function () {
            if (keysDown[KeyCode.ENTER] || game.lvl === 0 || (window.DEBUG && game.lvl === 1)) {
                lastKeyDown = KeyCode.EMPTY;

                level.reset();

                switch (++game.lvl) {
                    case 1:
                        lvl1.init();
                        level.curLvl = lvl1;
                        break;
                    case 2:
                        lvl2.init();
                        level.curLvl = lvl2;
                        break;
                    case 3:
                        var lvl3 = new Level3();
                        level.curLvl = lvl3;
                }

                level.isCutscene = false;
            }
        },

        render: function () {
            // background
            ctx.fillStyle = "#000";
            ctx.fillRect(0, 0, FULLW, canvas.height);

            // title
            ctx.font = "24px 'Press Start 2P'";
            var title = "LEVEL " + game.lvl + " COMPLETE";
            var titleW = ctx.measureText(title).width;
            ctx.fillStyle = Color.ORANGE;
            ctx.fillText(title, HALFW - titleW/2, 70);
            
            // level time
            ctx.font = "18px 'Press Start 2P'";
            var time = utils.getTimeObj(level.time);
            var timeTxt = "LEVEL TIME......" + time.min + ':' + time.sec;
            var timeW = ctx.measureText(timeTxt).width;
            ctx.fillStyle = "#e1e1e1";
            ctx.fillText(timeTxt, HALFW - titleW / 2, 150);

            // hidden items
            ctx.font = "18px 'Press Start 2P'";
            var hdnItems = "HIDDEN ITEMS....." + level.hiddenItemsFound + '/' + level.hiddenItems;
            var hdnItemsW = ctx.measureText(hdnItems).width;
            ctx.fillStyle = "#e1e1e1";
            ctx.fillText(hdnItems, HALFW - hdnItemsW / 2, 190);

            // cta
            Graphics.blinkText(16, HALFW, HALFH + 120);
        }
    };
})();
