/// <reference path="../linker.js" />

// A library of generic physics functions.
var Physics = (function () {


    return {
        // TODO: speed up by checking if a does NOT intersect with b (i.e. using OR)
        // Uses simple Speculative Contacts
        isCollision: function (a, b, moe, isLvl) {
            var aX = (typeof (isLvl) !== "undefined") ? a.pos.x + a.lvlX : a.pos.x;

            if ((aX + moe <= (b.pos.x + b.w)) && // a is to the left of the right side of b
				(b.pos.x + moe <= (aX + a.w)) && // a is to the right of the left side of b
				(a.pos.y + moe <= (b.pos.y + b.h)) && // a is higher than the bot of b
				(b.pos.y + moe <= (a.pos.y + a.h)) 	  // a is lower than the top of b
			) {
                return true;
            }

            return false;
        },
        
        // Checks for a collision between two polygons (uses SAT and AABB).
        // @param(GameObj) a A game object.
        // @param(GameObj) b A game object.
        // @param(function) callback A function invoked with SAT.Response ONLY IF a collision occurred.
        isSATcollision: function (a, b, callback) {
            var r = new SAT.Response();
            if (SAT.testPolygonPolygon(a, b, r)) {
                callback(r);
            }
        },

        // Tests collision between gObj and level.objs[]
        // @param(GameObj) gObj A game object (or subclass).
        // @param(function) callback A callback function.  Called with a SAT.Response().
        testObjObjs: function (gObj, callback) {
            var response = new SAT.Response();

            for(var i = 0; i < level.objs.length; ++i) {
                var obj = level.objs[i];

                if (typeof(obj.collidable) === "undefined"
                    //&& obj !== gObj         // checks if object is in list (by reference)
                ) {

                    // Check Level Object Collision
                    var collided = SAT.testPolygonPolygon(gObj, obj, response);

                    // Respond to Level Object Collision
                    if(collided) {
                        callback(response);
                    }

                    response.clear();
                }
            }

            // idea to fix "hooking" around edges of platform
            // http://stackoverflow.com/a/1355695/353166
        },

        // Tests collision between item and level.items[]
        // @param(GameItem) item A game item.
        // @param(function) callback A callback function.  Called with a SAT.Response().
        testItemItems: function (item, callback) {
            var response = new SAT.Response();

            for (var i = 0; i < level.items.length; ++i) {
                if (!level.items[i].isBeingHeld) {
                        
                    if (level.items[i].type !== JQObject.CRATE)       // TODO: allow non-crates
                        continue;

                    var collided = SAT.testPolygonPolygon(item, level.items[i], response);
                        
                    if (collided) {
                        if (response.overlapN.y === 1) {   // a is on top of b
                            response.a.pos.x -= response.overlapV.x;
                            response.a.pos.y -= response.overlapV.y;

                            callback(response);
                            break;
                        }
                    }

                    response.clear();
                }
            }
        },

        // Tests collision between hero and the level.items[]
        // @param(function) callback A callback function.  Called with a SAT.Response and the index of the item.
        testHeroItems: function (callback) {
            for (var i = 0; i < level.items.length; ++i) {
                if (level.items[i].visible) {
                    Physics.isSATcollision(hero, level.items[i], function (r) {
                            callback(r, i);
                    });
                }
            }
        },


    handleScale: function() {
            var numCratesOnScales = 0;

            for(var i = 0; i < level.objs.length; ++i) {
                if(level.objs[i].type === JQObject.SCALE &&
                    typeof (level.objs[i].holdingItem) !== "undefined" && level.objs[i].holdingItem !== null &&
                    level.objs[i].holdingItem.type === JQObject.CRATE
                ) {
                    ++numCratesOnScales;
                }
            }

            var doLadder = (numCratesOnScales === 2);

            if(doLadder) {
                audio.discovery.play();

                var result = $.grep(level.objs, function(e) {
                    return e.type === JQObject.LADDER;
                });
                result[0].visible = true;
            }

            return doLadder;
        },

        // Tests collision between items
        //testAllItems: function () {
        //    var response = new SAT.Response();

        //    for (var i = 0; i < level.items.length; ++i) {
        //        for (var j = 0; j < level.items.length; ++j) {
        //            if (i !== j && !level.items[i].isBeingHeld && !level.items[j].isBeingHeld) {
                        
        //                if (level.items[i].type !== JQObject.CRATE || level.items[j].type !== JQObject.CRATE)       // TODO: allow non-crates
        //                    continue;

        //                var collided = SAT.testPolygonPolygon(level.items[i], level.items[j], response);
                        
        //                if (collided) {
        //                    if (response.overlapN.y === 1) {   // a is on top of b
        //                        response.a.pos.x -= response.overlapV.x;
        //                        response.a.pos.y -= response.overlapV.y;

        //                        response.a.isOnObj = true;
        //                        response.a.onObj = response.b;
        //                        response.b.grabbable = false;

        //                        level.items.push(response.a);
        //                    }
        //                }

        //                response.clear();
        //            }
        //        }
        //    }
        //}
    };
})();
