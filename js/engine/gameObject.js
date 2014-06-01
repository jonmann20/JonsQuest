/// <reference path="../linker.js" />

var JQObject = Object.freeze({
    EMPTY: 0,
    CRATE: 1,
    LADDER: 2,
    SACK: 3,
    ENEMY: 4,
    CASH: 5,
    DOOR: 6,
    SCALE: 7,
    CLOUD: 8,
    PLATFORM: 9,
    SHURIKEN: 10,
    SLOPE: 11,
    POLY: 12,
    HILL: 13,
    ELEVATOR: 14,
    SCALEBG: 15,
    FIREBALL: 16
});

var JQObject_names = Object.freeze({
    0: "EMPTY",
    1: "CRATE",
    2: "LADDER",
    3: "SACK",
    4: "ENEMY",
    5: "CASH",
    6: "DOOR",
    7: "SCALE",
    8: "CLOUD",
    9: "PLATFORM",
    10: "SHURIKEN",
    11: "SLOPE",
    12: "POLY",
    13: "HILL",
    14: "ELEVATOR",
    15: "SCALEBG",
    16: "FIREBALL"
});

/*
    GameObj is the base class from which all objects in the game inherit from.
    Every GameObj has a SAT.Vector (pos);       TODO: make Vector not Polygon
    
    @param(JQObject) type The type of the object.
    @param(number) x The x position of the object.
    @param(number) y The y position of the object.
    @param(number?) w The width of the object.
    @param(number?) h The height of the object.
    @param(Image?) src The filename of the object sprite.  unused by default
    @param(Dir) dir The slope direction. TODO: move to own class

    @constructor
*/
var GameObj = function (type, x, y, w, h, src, dir) {
    this.dir = dir;

    // this.pos
    if (type === JQObject.PLATFORM || type === JQObject.ELEVATOR) {
        $.extend(this, Graphics.getSkewedRect(x, y, w, h));
    }
    else if(type === JQObject.SLOPE) {
        $.extend(this, Graphics.getStairPoly(x, y, w, h, dir));
    }
    else if(type === JQObject.HILL) {
        $.extend(this, Graphics.getHill(x, y, w, h));
    }
    else if(type === JQObject.POLY) {
        // custom polygon
    }
    else {
        $.extend(this, new SAT.Box(new SAT.Vector(x, y), w, h).toPolygon());
    }

    this.type = type;
    this.imgReady = false;     // TODO: make private

    if (typeof (src) === "undefined" || src === null) {
        this.w = w;
        this.h = h;
    }
    else {
        this.w = w; // TODO: fix
        this.h = h;

        this.img = new Image();

        var that = this;
        this.img.onload = function () {
            that.imgReady = true;
            that.w = this.width;
            that.h = this.height;
        };
        
        this.img.src = "img/" + src;
    }
};

GameObj.prototype = {
    draw: function () {
        if (this.imgReady) {
            ctx.drawImage(this.img, this.pos.x, this.pos.y);
        }
        else {
            if(this.type === JQObject.SCALEBG) {
                ctx.fillStyle = Color.LIGHT_BROWN;
            }
            else if(this.type === JQObject.FIREBALL) {
                ctx.fillStyle = "orange";
            }
            else {
                ctx.fillStyle = "red";
            }

            ctx.fillRect(this.pos.x, this.pos.y, this.w, this.h);
        }
    }
};
