/// <reference path="../linker.js" />

/*
    A library of generic graphics functions.
*/
var Graphics = (function () {

    var alpha = 1,
        canvasTransition = null,
        swellN = 250,
        swellTimer = swellN,
        swellRadius = swellN
    ;

    return {
        ticker: 1,              // 1.0 --> 0.0 --> 1.0 --> ...
        tickerStep: 0.01,
        fadeOut: false,
        projectX: 8,
        projectY: 11,


        fadeCanvas: function (callback) {
            if (utils.browser() === "MSIE 9.0") {
                callback();
            }
            else {
                $(canvas).removeClass("preTransition");
                $(canvas).addClass("duringTransition");

                canvasTransition = $(canvas).on("transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd", function () {
                    canvasTransition.off();

                    $(this).removeClass("duringTransition");
                    $(this).addClass("preTransition");

                    callback();
                });
            }
        },

        blinkText: function (fontSize, x, y, str) {
            str = (typeof (str) !== "undefined") ? str : "PRESS ENTER";

            if (Graphics.ticker >= 1.35 || Graphics.ticker <= Graphics.tickerStep) {
                Graphics.fadeOut = !Graphics.fadeOut;
            }

            if (Graphics.ticker >= 1) {
                alpha = 1;
            }
            else if (Graphics.ticker <= Graphics.tickerStep) {
                alpha = 0;
            }
            else {
                alpha = Graphics.ticker;
            }

            ctx.font = fontSize + "px 'Press Start 2P'";
            var tmpW = ctx.measureText(str).width;
            ctx.fillStyle = "rgba(233, 233, 233," + alpha + ')';
            ctx.fillText(str, x - tmpW / 2, y);
        },

        /*
            Converts a rectangle into a 'skewed rectangle' polygon

            @param(number) x
            @param(number) y
            @param(number) w
            @param(number) h
            @return (SAT.Polygon)
        */
        getSkewedRect: function (x, y, w, h) {
            y += Graphics.projectY / 2;

            var poly = new SAT.Polygon(new SAT.Vector(x, y), [
                new SAT.Vector(),
                new SAT.Vector(w - Graphics.projectX, 0),
                new SAT.Vector(w, Graphics.projectY),
                new SAT.Vector(w, h),
                new SAT.Vector(Graphics.projectX, h),
                new SAT.Vector(0, h - Graphics.projectY)
            ]);

            return poly;
        },

        getStairPoly: function(x, y, w, h, dir) {
            var poly;
            if(dir === Dir.UP_RIGHT) {
                poly = new SAT.Polygon(new SAT.Vector(x, y), [
                    new SAT.Vector(),
                    new SAT.Vector(w - Graphics.projectX, -h),
                    new SAT.Vector(w, -h + Graphics.projectY),
                    new SAT.Vector(w, 0),
                    new SAT.Vector(Graphics.projectX, h),
                    new SAT.Vector(0, h - Graphics.projectY)
                ]);
            }
            else {
                poly = new SAT.Polygon(new SAT.Vector(x, y), [
                    new SAT.Vector(),
                    new SAT.Vector(w - Graphics.projectX, h - Graphics.projectY - 5),
                    new SAT.Vector(w, h - 4),
                    new SAT.Vector(0, h),
                    new SAT.Vector(Graphics.projectX, h),
                    new SAT.Vector(0, h - Graphics.projectY)
                ]);
            }

            return poly;
        },

        setClouds: function(){
            var x = 0,
                y = 0,
                maxY = 180
            ;

            while(x < lvl1.width) {
                var obj = new GameObj(JQObject.CLOUD, x, 10 + y, 0, 0, "cloud.png");
                obj.speed = utils.randF(2, 3.3, 1);
                level.bg.push(obj);

                x += obj.w * utils.speed2scale(obj.speed) + Math.floor((Math.random() * 70) + 35);
                y = Math.floor(Math.random() * maxY);
            }
        },

        drawLadder: function (platform) {
            var x = platform.pos.x,
                y = platform.pos.y,
                w = platform.edges[0].x,
                h = platform.edges[1].y
            ;

            // sides
            ctx.fillStyle = Color.LIGHT_BROWN;
            ctx.fillRect(x, y, 5, h);
            ctx.fillRect(x + w-5, y, 5, h);

            // rungs
            for (var i = 13; i < h; i+=20) {
                ctx.fillRect(x, y+i, w, 8);
            }
        },

        getScale: function(x, y) {
            var theScale = {};

            for(var i = 0; i < 2; ++i) {
                var dir = (i === 0) ? Dir.LEFT : Dir.RIGHT;

                theScale[dir] = new GameObj(JQObject.SCALE, x + i * 300, y, 150, 46);
                theScale[dir].holdingItem = null; // TODO: fix api
            }

            theScale.vBar = new GameObj(JQObject.SCALEBG,
                theScale[Dir.LEFT].pos.x + theScale[Dir.LEFT].w + 70,
                HALFH - game.padFloor,
                10,
                HALFH
            );
            theScale.vBar.collidable = false;

            theScale.hBar = new GameObj(JQObject.SCALEBG,
                theScale[Dir.LEFT].pos.x + theScale[Dir.LEFT].w / 2,
                HALFH,
                300,
                10
            );
            theScale.hBar.x2 = theScale.hBar.pos.x + theScale.hBar.w;
            theScale.hBar.y2 = theScale.hBar.pos.y;
            theScale.hBar.collidable = false;
            theScale.hBar.visible = false;

            theScale[Dir.LEFT].hBar = theScale.hBar;
            theScale[Dir.LEFT].side = Dir.LEFT;
            theScale[Dir.LEFT].otherSide = theScale[Dir.RIGHT];

            theScale[Dir.RIGHT].hBar = theScale.hBar;
            theScale[Dir.RIGHT].side = Dir.RIGHT;
            theScale[Dir.RIGHT].otherSide = theScale[Dir.LEFT];

            return theScale;
        },

        drawScale: function (platform) {
            var x = platform.pos.x,
                y = platform.pos.y,
                w = platform.edges[0].x,
                h = platform.edges[1].y
            ;
            
            // draw top border 1px above bounding box
            ctx.fillStyle = Color.BLACK;
            ctx.fillRect(x, y - 1, w, 1);

            // draw platform
            ctx.fillStyle = Color.DARK_BROWN;
            ctx.fillRect(x, y, w, h);
        },

        drawScaleChains:function(x, y, scale) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(scale.pos.x, scale.pos.y);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(scale.pos.x + scale.w / 2, scale.pos.y);
            ctx.stroke();
            ctx.closePath();

            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(scale.pos.x + scale.w, scale.pos.y);
            ctx.stroke();
            ctx.closePath();
        },

        drawScaleBg: function(theScale){
            ctx.strokeStyle = "#000";
            ctx.lineWidth = 10;

            // hBar
            ctx.beginPath();
            ctx.moveTo(theScale.hBar.pos.x, theScale.hBar.pos.y);
            ctx.lineTo(theScale.hBar.x2, theScale.hBar.y2);
            ctx.stroke();
            ctx.closePath();
            
            // left scale chains
            Graphics.drawScaleChains(theScale.hBar.pos.x, theScale.hBar.pos.y, theScale[Dir.LEFT]);

            // right scale chains
            Graphics.drawScaleChains(theScale.hBar.x2, theScale.hBar.y2, theScale[Dir.RIGHT]);
        },

        /*
            @param(SAT.Polygon) poly An SAT.Polygon.
            @param(?Color) fillStyle The fill style of the polygon
            @param(?number, ?number) trans A translated x and y dimension.
        */
        drawPoly: function(poly, fillStyle, trans) {
            var y = poly.pos.y - Graphics.projectY;
            var x = poly.pos.x;

            if(typeof (trans) !== "undefined") {
                x += trans.x;
                y += trans.y;
            }

            ctx.fillStyle = (typeof(fillStyle) !== "undefined") ? fillStyle : "orange";
            ctx.beginPath();
            ctx.moveTo(x, y);

            for(var i = 1; i < poly.points.length; ++i) {
                ctx.lineTo(x + poly.points[i].x, y + poly.points[i].y);
            }

            ctx.closePath();
            ctx.fill();
        },

        drawHill: function(poly) {
            for(var i = 0; i < game.padFloor - 15; ++i) {
                Graphics.drawPoly(poly, Color.LIGHT_BROWN, { x: 0, y: i });
            }
            Graphics.drawPoly(poly, Color.DARK_BROWN, { x: Graphics.projectX, y: game.padFloor});
            //Graphics.drawPoly(poly, Color.DARK_BROWN, { x: 10, y: game.padFloor -2 });
        },

        getHill: function(x, y, w, h) {
            var arr = [new SAT.V()];

            x += w / 2;
            y += Graphics.projectY;

            var a = w / 2,  // the horizontal radius
                b = h / 2,  // the vertical radius
                t = 180,    // the angle between the horizontal radius and a vector to any point on the curve (in degrees)
                xx,
                yy
            ;

            while(t !== 360) {
                xx = a * Math.cos(utils.degToRad(t));
                yy = b * Math.sin(utils.degToRad(t++));
                arr.push(new SAT.V(xx, yy));
            }

            arr.push(new SAT.V(w/2));

            return new SAT.Polygon(new SAT.V(x, y), arr);
        },

        drawPlatform: function (poly) {
            var y = poly.pos.y - Graphics.projectY / 2;

            // top
            ctx.fillStyle = Color.LIGHT_BROWN;
            ctx.beginPath();
            ctx.moveTo(poly.pos.x, y);
            ctx.lineTo(poly.pos.x + poly.points[1].x, y + poly.points[1].y);
            ctx.lineTo(poly.pos.x + poly.points[2].x, y + poly.points[2].y);
            ctx.lineTo(poly.pos.x + Graphics.projectX, y + Graphics.projectY);
            ctx.closePath();
            ctx.fill();

            // body
            ctx.fillStyle = Color.DARK_BROWN;
            ctx.beginPath();
            ctx.moveTo(poly.pos.x + poly.points[2].x, y + poly.points[2].y);
            ctx.lineTo(poly.pos.x + poly.points[3].x, y + poly.points[3].y);
            ctx.lineTo(poly.pos.x + poly.points[4].x, y + poly.points[4].y);
            ctx.lineTo(poly.pos.x + poly.points[5].x, y + poly.points[5].y);
            ctx.lineTo(poly.pos.x + poly.points[0].x, y + poly.points[0].y);
            ctx.lineTo(poly.pos.x + Graphics.projectX, y + Graphics.projectY);
            ctx.closePath();
            ctx.fill();
        },

        drawPlatformStatus: function (platform) {
            var x = platform.pos.x,
                y = platform.pos.y,
                w = platform.w,
                h = platform.h,
                theShape = 26,
                halfTheShape = theShape/2,
                midX = x + w/2 - halfTheShape,
                midY = y + h/2 - halfTheShape
            ;

            ctx.lineWidth = 3;

            if (platform.holdingItem !== null && platform.holdingItem.type === JQObject.CRATE) {
                // draw check mark
                ctx.strokeStyle = "green";

                --midY;
                ctx.beginPath();
                ctx.moveTo(midX, midY + halfTheShape);
                ctx.lineTo(midX + halfTheShape, midY + theShape);
                ctx.moveTo(midX + halfTheShape-1, midY + theShape);
                ctx.lineTo(midX + theShape+2, midY+2);
                ctx.stroke();
                ctx.closePath();

            }
            else {
                // draw 'X'
                ctx.strokeStyle = "red";

                ctx.beginPath();
                ctx.moveTo(midX, midY);
                ctx.lineTo(midX + theShape, midY + theShape);
                ctx.moveTo(midX, midY + theShape);
                ctx.lineTo(midX + theShape, midY);
                ctx.stroke();
                ctx.closePath();
            }
        },

        // @param(GameObj) gObj A game object.
        drawDoor: function (gObj) {
            // alias
            var x = gObj.pos.x;
            var y = gObj.pos.y;
            var w = gObj.w;
            var h = gObj.h;

            // door
            ctx.fillStyle = Color.LIGHT_BROWN;
            ctx.fillRect(x + 2, y + 2, w - 2, h - 2);

            ctx.fillStyle = Color.DARK_BROWN;

            ctx.fillRect(x, y, 2, h);   // left frame
            ctx.fillRect(x, y, w, 2);   // top frame
            ctx.fillRect(x + w, y, 2, h);   // right frame

            // door handle
            ctx.beginPath();
            ctx.arc(x + w - (w / 3.2), y + h - (h / 3.4), 4, 0, 2 * Math.PI, false);
            ctx.fill();
            ctx.closePath();

            // label
            ctx.font = "19px 'Press Start 2P'";
            ctx.fillStyle = Color.DARK_BROWN;
            ctx.fillText("EXIT", x - 15, y - 3);
            ctx.fillStyle = Color.LIGHT_BROWN;
            ctx.fillText("EXIT", x - 18, y - 5);
        },

        getDoorBgGrad: function(){
            var grad = ctx.createRadialGradient(
                level.bgColor.gradX,
                level.bgColor.gradY,
                14,
                level.bgColor.gradX,
                level.bgColor.gradY,
                490 - swellRadius
            );

            if(--swellTimer === -swellN) {
                swellTimer = swellN;
                swellRadius = swellN;
            }
            else if(swellTimer < 0) {
                ++swellRadius;
            }
            else {
                --swellRadius;
            }

            grad.addColorStop(0, "rgb(203,163,0)");
            //grad.addColorStop(0, "rgb(42,126,76)");
            //grad.addColorStop(1, "rgb(22,106,56)");
            grad.addColorStop(1, "#1F7DCF");

            return grad;
        },

        drawEllipse: function (x, y, w, h) {
            var kappa = 0.5522848,
				ox = (w / 2) * kappa, // control point offset horizontal
				oy = (h / 2) * kappa, // control point offset vertical
				xe = x + w, // x-end
				ye = y + h, // y-end
				xm = x + w / 2, // x-middle
				ym = y + h / 2 // y-middle
            ;

            ctx.beginPath();
            ctx.moveTo(x, ym);
            ctx.bezierCurveTo(x, ym - oy, xm - ox, y, xm, y);
            ctx.bezierCurveTo(xm + ox, y, xe, ym - oy, xe, ym);
            ctx.bezierCurveTo(xe, ym + oy, xm + ox, ye, xm, ye);
            ctx.bezierCurveTo(xm - ox, ye, x, ym + oy, x, ym);
            ctx.closePath();
            ctx.fill();
        },

        drawRotate: function (img, x, y, angle) {
            ctx.save();

            ctx.translate(x, y);								// move co-ord sys to img origin
            ctx.rotate(utils.degToRad(angle));
            ctx.translate(-img.width * 0.5, -img.height * 0.5); // move to top left of img

            //ctx.scale(0.75, 0.75);
            ctx.drawImage(img, 0, 0);

            ctx.restore();
        }
    };
})();


/* Images */
//lvl = new Array(NUM_LEVELS),
//lvlBgImg = {}
//function loadBgImages(imgArr, callback) {
//    var count = 0;

//    for (var key in imgArr) {
//        if (imgArr[key] !== "none") {
//            lvlBgImg[key] = new Image();
//            lvlBgImg[key].onload = function () {
//                callback(this.num);
//            };

//            lvlBgImg[key].src = imgArr[key];
//            lvlBgImg[key].num = count;
//        }

//        ++count;
//    }
//}

//for (var i = 0; i < NUM_LEVELS; ++i) {
//    lvl[i] = {
//        status: false,
//        bgColor: '#' + Math.floor(Math.random() * 16777215).toString(16)
//    };
//}

//loadBgImages({
//    lvl0: "img/lvl0.jpg",
//    lvl1: "none"
//}, function (num) {
//    lvl[num].status = true;
//});




//var wasClicked = false;
//$(".resize").on("click", function(){
//    if (wasClicked) {
//        $(canvas).css({ width: "", height: "" });
//        $(this).attr("class", "resize off");
//        $(this).children("span").attr("class", "icon-expand");
//    }
//    else {
//        $(canvas).css({ width: "100%" });

//        // fix for IE
//        var width = $(canvas).width();
//        $(canvas).css({ height: 0.611 * width });


//        $(this).attr("class", "resize on");
//        $(this).children("span").attr("class", "icon-contract");
//    }

//    wasClicked = !wasClicked;
//});
