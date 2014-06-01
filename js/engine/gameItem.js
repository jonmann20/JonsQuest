/*
    GameItem extends GameObj
    GameItem may extend SAT.Vector to be SAT.Polygon

    @param(GameObj) gObj A game object.
    @param(?bool) grabbable Whether the game item can be pickup up or not. (false by default)
    @param(?number) val The value of the game item. (-1 by default)
    @param(?bool) visible Whether the game item is displayed or not.  (true by default)
*/
var GameItem = function (gObj, grabbable, val, visible) {
    utils.extend(this, gObj);
    
    this.grabbable = (typeof (grabbable) !== "undefined") ? grabbable : false;
    this.val = (typeof(val) !== "undefined") ? val : -1;
    this.visible = (typeof (visible) !== "undefined") ? visible : true;

    this.vY = 0;
    this.isOnObj = false;   // TODO: allow setting to true to avoid "thud" sound on level start
    this.onObj = null;      // contains the object holding up the object (directly below)

    this.isBeingHeld = false;

    // TODO: make private/prototype
    var parentDraw = this.draw;
    this.draw = function () {
        if (this.visible) {
            parentDraw.apply(this);
        }
    };
};

//GameItem.prototype = {
//};
