// Version 0.2 - Copyright 2013 -  Jim Riecken <jimr@jimr.ca>
//
// Released under the MIT License - https://github.com/jriecken/sat-js
//
// A simple library for determining intersections of circles and
// polygons using the Separating Axis Theorem.
/** @preserve SAT.js - Version 0.2 - Copyright 2013 - Jim Riecken <jimr@jimr.ca> - released under the MIT License. https://github.com/jriecken/sat-js */

/*global define: false, module: false*/
/*jshint shadow:true, sub:true, forin:true, noarg:true, noempty:true, 
  eqeqeq:true, bitwise:true, strict:true, undef:true, 
  curly:true, browser:true */

// Create a UMD wrapper for SAT. Works in:
//
//  - Plain browser via global SAT variable
//  - AMD loader (like require.js)
//  - Node.js
//
// The quoted properties all over the place are used so that the Closure Compiler
// does not mangle the exposed API in advanced mode.
/**
 * @param {*} root - The global scope
 * @param {Function} factory - Factory that creates SAT module
 */
(function (root, factory) {
  "use strict";
  if (typeof define === 'function' && define['amd']) {
    define(factory);
  } else if (typeof exports === 'object') {
    module['exports'] = factory();
  } else {
    root['SAT'] = factory();
  }
}(this, function () {
  "use strict";

  var SAT = {};

  //
  // ## Vector
  //
  // Represents a vector in two dimensions with `x` and `y` properties.


  // Create a new Vector, optionally passing in the `x` and `y` coordinates. If
  // a coordinate is not specified, it will be set to `0`
  /** 
   * @param {?number=} x The x position.
   * @param {?number=} y The y position.
   * @constructor
   */
  function Vector(x, y) {
    this['x'] = x || 0;
    this['y'] = y || 0;
  }
  SAT['Vector'] = Vector;
  // Alias `Vector` as `V`
  SAT['V'] = Vector;


  // Copy the values of another Vector into this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['copy'] = Vector.prototype.copy = function(other) {
    this['x'] = other['x'];
    this['y'] = other['y'];
    return this;
  };

  // Change this vector to be perpendicular to what it was before. (Effectively
  // roatates it 90 degrees in a clockwise direction)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['perp'] = Vector.prototype.perp = function() {
    var x = this['x'];
    this['x'] = this['y'];
    this['y'] = -x;
    return this;
  };

  // Rotate this vector (counter-clockwise) by the specified angle (in radians).
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Vector} This for chaining.
   */
  Vector.prototype['rotate'] = Vector.prototype.rotate = function (angle) {
    var x = this['x'];
    var y = this['y'];
    this['x'] = x * Math.cos(angle) - y * Math.sin(angle);
    this['y'] = x * Math.sin(angle) + y * Math.cos(angle);
    return this;
  };

  // Reverse this vector.
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reverse'] = Vector.prototype.reverse = function() {
    this['x'] = -this['x'];
    this['y'] = -this['y'];
    return this;
  };
  

  // Normalize this vector.  (make it have length of `1`)
  /**
   * @return {Vector} This for chaining.
   */
  Vector.prototype['normalize'] = Vector.prototype.normalize = function() {
    var d = this.len();
    if(d > 0) {
      this['x'] = this['x'] / d;
      this['y'] = this['y'] / d;
    }
    return this;
  };
  
  // Add another vector to this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['add'] = Vector.prototype.add = function(other) {
    this['x'] += other['x'];
    this['y'] += other['y'];
    return this;
  };
  
  // Subtract another vector from this one.
  /**
   * @param {Vector} other The other Vector.
   * @return {Vector} This for chaiing.
   */
  Vector.prototype['sub'] = Vector.prototype.sub = function(other) {
    this['x'] -= other['x'];
    this['y'] -= other['y'];
    return this;
  };
  
  // Scale this vector. An independant scaling factor can be provided
  // for each axis, or a single scaling factor that will scale both `x` and `y`.
  /**
   * @param {number} x The scaling factor in the x direction.
   * @param {?number=} y The scaling factor in the y direction.  If this
   *   is not specified, the x scaling factor will be used.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['scale'] = Vector.prototype.scale = function(x,y) {
    this['x'] *= x;
    this['y'] *= y || x;
    return this; 
  };
  
  // Project this vector on to another vector.
  /**
   * @param {Vector} other The vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['project'] = Vector.prototype.project = function(other) {
    var amt = this.dot(other) / other.len2();
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Project this vector onto a vector of unit length. This is slightly more efficient
  // than `project` when dealing with unit vectors.
  /**
   * @param {Vector} other The unit vector to project onto.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['projectN'] = Vector.prototype.projectN = function(other) {
    var amt = this.dot(other);
    this['x'] = amt * other['x'];
    this['y'] = amt * other['y'];
    return this;
  };
  
  // Reflect this vector on an arbitrary axis.
  /**
   * @param {Vector} axis The vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflect'] = Vector.prototype.reflect = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.project(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Reflect this vector on an arbitrary axis (represented by a unit vector). This is
  // slightly more efficient than `reflect` when dealing with an axis that is a unit vector.
  /**
   * @param {Vector} axis The unit vector representing the axis.
   * @return {Vector} This for chaining.
   */
  Vector.prototype['reflectN'] = Vector.prototype.reflectN = function(axis) {
    var x = this['x'];
    var y = this['y'];
    this.projectN(axis).scale(2);
    this['x'] -= x;
    this['y'] -= y;
    return this;
  };
  
  // Get the dot product of this vector and another.
  /**
   * @param {Vector}  other The vector to dot this one against.
   * @return {number} The dot product.
   */
  Vector.prototype['dot'] = Vector.prototype.dot = function(other) {
    return this['x'] * other['x'] + this['y'] * other['y'];
  };
  
  // Get the squared length of this vector.
  /**
   * @return {number} The length^2 of this vector.
   */
  Vector.prototype['len2'] = Vector.prototype.len2 = function() {
    return this.dot(this);
  };
  
  // Get the length of this vector.
  /**
   * @return {number} The length of this vector.
   */
  Vector.prototype['len'] = Vector.prototype.len = function() {
    return Math.sqrt(this.len2());
  };
  
  // ## Circle
  //
  // Represents a circle with a position and a radius.

  // Create a new circle, optionally passing in a position and/or radius. If no position
  // is given, the circle will be at `(0,0)`. If no radius is provided, the circle will
  // have a radius of `0`.
  /**
   * @param {Vector=} pos A vector representing the position of the center of the circle
   * @param {?number=} r The radius of the circle
   * @constructor
   */
  function Circle(pos, r) {
    this['pos'] = pos || new Vector();
    this['r'] = r || 0;
  }
  SAT['Circle'] = Circle;

  // ## Polygon
  //
  // Represents a *convex* polygon with any number of points (specified in counter-clockwise order)
  //
  // The edges/normals of the polygon will be calculated on creation and stored in the
  // `edges` and `normals` properties. If you change the polygon's points, you will need
  // to call `recalc` to recalculate the edges/normals.

  // Create a new polygon, passing in a position vector, and an array of points (represented
  // by vectors relative to the position vector). If no position is passed in, the position
  // of the polygon will be `(0,0)`.
  /**
   * @param {Vector=} pos A vector representing the origin of the polygon. (all other
   *   points are relative to this one)
   * @param {Array.<Vector>=} points An array of vectors representing the points in the polygon,
   *   in counter-clockwise order.
   * @constructor
   */
  function Polygon(pos, points) {
    this['pos'] = pos || new Vector();
    this['points'] = points || [];
    this.recalc();
  }
  SAT['Polygon'] = Polygon;
  
  // Recalculates the edges and normals of the polygon. This **must** be called
  // if the `points` array is modified at all and the edges or normals are to be
  // accessed.
  /**
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['recalc'] = Polygon.prototype.recalc = function() {
    // The edges here are the direction of the `n`th edge of the polygon, relative to
    // the `n`th point. If you want to draw a given edge from the edge value, you must
    // first translate to the position of the starting point.
    this['edges'] = [];
    // The normals here are the direction of the normal for the `n`th edge of the polygon, relative
    // to the position of the `n`th point. If you want to draw an edge normal, you must first
    // translate to the position of the starting point.
    this['normals'] = [];
    var points = this['points'];
    var len = points.length;
    for (var i = 0; i < len; i++) {
      var p1 = points[i]; 
      var p2 = i < len - 1 ? points[i + 1] : points[0];
      var e = new Vector().copy(p2).sub(p1);
      var n = new Vector().copy(e).perp().normalize();
      this['edges'].push(e);
      this['normals'].push(n);
    }
    return this;
  };

  // Rotates this polygon counter-clockwise around the origin of *its local coordinate system* (i.e. `pos`).
  //
  // Note: You do **not** need to call `recalc` after rotation.
  /**
   * @param {number} angle The angle to rotate (in radians)
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['rotate'] = Polygon.prototype.rotate = function(angle) {
    var i;
    var points = this['points'];
    var edges = this['edges'];
    var normals = this['normals'];
    var len = points.length;
    for (i = 0; i < len; i++) {
      points[i].rotate(angle);
      edges[i].rotate(angle);
      normals[i].rotate(angle);
    }
    return this;
  };

  // Translates the points of this polygon by a specified amount relative to the origin of *its own coordinate
  // system* (i.e. `pos`).
  //
  // This is most useful to change the "center point" of a polygon.
  //
  // Note: You do **not** need to call `recalc` after translation.
  /**
   * @param {number} x The horizontal amount to translate.
   * @param {number} y The vertical amount to translate.
   * @return {Polygon} This for chaining.
   */
  Polygon.prototype['translate'] = Polygon.prototype.translate = function (x, y) {
    var i;
    var points = this['points'];
    var len = points.length;
    for (i = 0; i < len; i++) {
      points[i].x += x;
      points[i].y += y;
    }
    return this;
  };

  // ## Box
  //
  // Represents an axis-aligned box, with a width and height.


  // Create a new box, with the specified position, width, and height. If no position
  // is given, the position will be `(0,0)`. If no width or height are given, they will
  // be set to `0`.
  /**
   * @param {Vector=} pos A vector representing the top-left of the box.
   * @param {?number=} w The width of the box.
   * @param {?number=} h The height of the box.
   * @constructor
   */
  function Box(pos, w, h) {
    this['pos'] = pos || new Vector();
    this['w'] = w || 0;
    this['h'] = h || 0;
  }
  SAT['Box'] = Box;

  // Returns a polygon whose edges are the same as this box.
  /**
   * @return {Polygon} A new Polygon that represents this box.
   */
  Box.prototype['toPolygon'] = Box.prototype.toPolygon = function() {
    var pos = this['pos'];
    var w = this['w'];
    var h = this['h'];
    return new Polygon(new Vector(pos['x'], pos['y']), [
     new Vector(), new Vector(w, 0), 
     new Vector(w,h), new Vector(0,h)
    ]);
  };
  
  // ## Response
  //
  // An object representing the result of an intersection. Contains:
  //  - The two objects participating in the intersection
  //  - The vector representing the minimum change necessary to extract the first object
  //    from the second one (as well as a unit vector in that direction and the magnitude
  //    of the overlap)
  //  - Whether the first object is entirely inside the second, and vice versa.
  /**
   * @constructor
   */  
  function Response() {
    this['a'] = null;
    this['b'] = null;
    this['overlapN'] = new Vector();
    this['overlapV'] = new Vector();
    this.clear();
  }
  SAT['Response'] = Response;

  // Set some values of the response back to their defaults.  Call this between tests if
  // you are going to reuse a single Response object for multiple intersection tests (recommented
  // as it will avoid allcating extra memory)
  /**
   * @return {Response} This for chaining
   */
  Response.prototype['clear'] = Response.prototype.clear = function() {
    this['aInB'] = true;
    this['bInA'] = true;
    this['overlap'] = Number.MAX_VALUE;
    return this;
  };

  // ## Object Pools

  // A pool of `Vector` objects that are used in calculations to avoid
  // allocating memory.
  /**
   * @type {Array.<Vector>}
   */
  var T_VECTORS = [];
  for (var i = 0; i < 10; i++) { T_VECTORS.push(new Vector()); }
  
  // A pool of arrays of numbers used in calculations to avoid allocating
  // memory.
  /**
   * @type {Array.<Array.<number>>}
   */
  var T_ARRAYS = [];
  for (var i = 0; i < 5; i++) { T_ARRAYS.push([]); }

  // ## Helper Functions

  // Flattens the specified array of points onto a unit vector axis,
  // resulting in a one dimensional range of the minimum and
  // maximum value on that axis.
  /**
   * @param {Array.<Vector>} points The points to flatten.
   * @param {Vector} normal The unit vector axis to flatten on.
   * @param {Array.<number>} result An array.  After calling this function,
   *   result[0] will be the minimum value,
   *   result[1] will be the maximum value.
   */
  function flattenPointsOn(points, normal, result) {
    var min = Number.MAX_VALUE;
    var max = -Number.MAX_VALUE;
    var len = points.length;
    for (var i = 0; i < len; i++ ) {
      // The magnitude of the projection of the point onto the normal
      var dot = points[i].dot(normal);
      if (dot < min) { min = dot; }
      if (dot > max) { max = dot; }
    }
    result[0] = min; result[1] = max;
  }
  
  // Check whether two convex polygons are separated by the specified
  // axis (must be a unit vector).
  /**
   * @param {Vector} aPos The position of the first polygon.
   * @param {Vector} bPos The position of the second polygon.
   * @param {Array.<Vector>} aPoints The points in the first polygon.
   * @param {Array.<Vector>} bPoints The points in the second polygon.
   * @param {Vector} axis The axis (unit sized) to test against.  The points of both polygons
   *   will be projected onto this axis.
   * @param {Response=} response A Response object (optional) which will be populated
   *   if the axis is not a separating axis.
   * @return {boolean} true if it is a separating axis, false otherwise.  If false,
   *   and a response is passed in, information about how much overlap and
   *   the direction of the overlap will be populated.
   */
  function isSeparatingAxis(aPos, bPos, aPoints, bPoints, axis, response) {
    var rangeA = T_ARRAYS.pop();
    var rangeB = T_ARRAYS.pop();
    // The magnitude of the offset between the two polygons
    var offsetV = T_VECTORS.pop().copy(bPos).sub(aPos);
    var projectedOffset = offsetV.dot(axis);
    // Project the polygons onto the axis.
    flattenPointsOn(aPoints, axis, rangeA);
    flattenPointsOn(bPoints, axis, rangeB);
    // Move B's range to its position relative to A.
    rangeB[0] += projectedOffset;
    rangeB[1] += projectedOffset;
    // Check if there is a gap. If there is, this is a separating axis and we can stop
    if (rangeA[0] > rangeB[1] || rangeB[0] > rangeA[1]) {
      T_VECTORS.push(offsetV); 
      T_ARRAYS.push(rangeA); 
      T_ARRAYS.push(rangeB);
      return true;
    }
    // This is not a separating axis. If we're calculating a response, calculate the overlap.
    if (response) {
      var overlap = 0;
      // A starts further left than B
      if (rangeA[0] < rangeB[0]) {
        response['aInB'] = false;
        // A ends before B does. We have to pull A out of B
        if (rangeA[1] < rangeB[1]) { 
          overlap = rangeA[1] - rangeB[0];
          response['bInA'] = false;
        // B is fully inside A.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      // B starts further left than A
      } else {
        response['bInA'] = false;
        // B ends before A ends. We have to push A out of B
        if (rangeA[1] > rangeB[1]) { 
          overlap = rangeA[0] - rangeB[1];
          response['aInB'] = false;
        // A is fully inside B.  Pick the shortest way out.
        } else {
          var option1 = rangeA[1] - rangeB[0];
          var option2 = rangeB[1] - rangeA[0];
          overlap = option1 < option2 ? option1 : -option2;
        }
      }
      // If this is the smallest amount of overlap we've seen so far, set it as the minimum overlap.
      var absOverlap = Math.abs(overlap);
      if (absOverlap < response['overlap']) {
        response['overlap'] = absOverlap;
        response['overlapN'].copy(axis);
        if (overlap < 0) {
          response['overlapN'].reverse();
        }
      }      
    }
    T_VECTORS.push(offsetV); 
    T_ARRAYS.push(rangeA); 
    T_ARRAYS.push(rangeB);
    return false;
  }
  
  // Calculates which Vornoi region a point is on a line segment.
  // It is assumed that both the line and the point are relative to `(0,0)`
  //
  //            |       (0)      |
  //     (-1)  [S]--------------[E]  (1)
  //            |       (0)      |
  /**
   * @param {Vector} line The line segment.
   * @param {Vector} point The point.
   * @return  {number} LEFT_VORNOI_REGION (-1) if it is the left region, 
   *          MIDDLE_VORNOI_REGION (0) if it is the middle region, 
   *          RIGHT_VORNOI_REGION (1) if it is the right region.
   */
  function vornoiRegion(line, point) {
    var len2 = line.len2();
    var dp = point.dot(line);
    // If the point is beyond the start of the line, it is in the
    // left vornoi region.
    if (dp < 0) { return LEFT_VORNOI_REGION; }
    // If the point is beyond the end of the line, it is in the
    // right vornoi region.
    else if (dp > len2) { return RIGHT_VORNOI_REGION; }
    // Otherwise, it's in the middle one.
    else { return MIDDLE_VORNOI_REGION; }
  }
  // Constants for Vornoi regions
  /**
   * @const
   */
  var LEFT_VORNOI_REGION = -1;
  /**
   * @const
   */
  var MIDDLE_VORNOI_REGION = 0;
  /**
   * @const
   */
  var RIGHT_VORNOI_REGION = 1;
  
  // ## Collision Tests

  // Check if two circles collide.
  /**
   * @param {Circle} a The first circle.
   * @param {Circle} b The second circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   the circles intersect.
   * @return {boolean} true if the circles intersect, false if they don't. 
   */
  function testCircleCircle(a, b, response) {
    // Check if the distance between the centers of the two
    // circles is greater than their combined radius.
    var differenceV = T_VECTORS.pop().copy(b['pos']).sub(a['pos']);
    var totalRadius = a['r'] + b['r'];
    var totalRadiusSq = totalRadius * totalRadius;
    var distanceSq = differenceV.len2();
    // If the distance is bigger than the combined radius, they don't intersect.
    if (distanceSq > totalRadiusSq) {
      T_VECTORS.push(differenceV);
      return false;
    }
    // They intersect.  If we're calculating a response, calculate the overlap.
    if (response) { 
      var dist = Math.sqrt(distanceSq);
      response['a'] = a;
      response['b'] = b;
      response['overlap'] = totalRadius - dist;
      response['overlapN'].copy(differenceV.normalize());
      response['overlapV'].copy(differenceV).scale(response['overlap']);
      response['aInB']= a['r'] <= b['r'] && dist <= b['r'] - a['r'];
      response['bInA'] = b['r'] <= a['r'] && dist <= a['r'] - b['r'];
    }
    T_VECTORS.push(differenceV);
    return true;
  }
  SAT['testCircleCircle'] = testCircleCircle;
  
  // Check if a polygon and a circle collide.
  /**
   * @param {Polygon} polygon The polygon.
   * @param {Circle} circle The circle.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonCircle(polygon, circle, response) {
    // Get the position of the circle relative to the polygon.
    var circlePos = T_VECTORS.pop().copy(circle['pos']).sub(polygon['pos']);
    var radius = circle['r'];
    var radius2 = radius * radius;
    var points = polygon['points'];
    var len = points.length;
    var edge = T_VECTORS.pop();
    var point = T_VECTORS.pop();
    
    // For each edge in the polygon:
    for (var i = 0; i < len; i++) {
      var next = i === len - 1 ? 0 : i + 1;
      var prev = i === 0 ? len - 1 : i - 1;
      var overlap = 0;
      var overlapN = null;
      
      // Get the edge.
      edge.copy(polygon['edges'][i]);
      // Calculate the center of the circle relative to the starting point of the edge.
      point.copy(circlePos).sub(points[i]);
      
      // If the distance between the center of the circle and the point
      // is bigger than the radius, the polygon is definitely not fully in
      // the circle.
      if (response && point.len2() > radius2) {
        response['aInB'] = false;
      }
      
      // Calculate which Vornoi region the center of the circle is in.
      var region = vornoiRegion(edge, point);
      // If it's the left region:
      if (region === LEFT_VORNOI_REGION) { 
        // We need to make sure we're in the RIGHT_VORNOI_REGION of the previous edge.
        edge.copy(polygon['edges'][prev]);
        // Calculate the center of the circle relative the starting point of the previous edge
        var point2 = T_VECTORS.pop().copy(circlePos).sub(points[prev]);
        region = vornoiRegion(edge, point2);
        if (region === RIGHT_VORNOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge);
            T_VECTORS.push(point); 
            T_VECTORS.push(point2);
            return false;
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
        T_VECTORS.push(point2);
      // If it's the right region:
      } else if (region === RIGHT_VORNOI_REGION) {
        // We need to make sure we're in the left region on the next edge
        edge.copy(polygon['edges'][next]);
        // Calculate the center of the circle relative to the starting point of the next edge.
        point.copy(circlePos).sub(points[next]);
        region = vornoiRegion(edge, point);
        if (region === LEFT_VORNOI_REGION) {
          // It's in the region we want.  Check if the circle intersects the point.
          var dist = point.len();
          if (dist > radius) {
            // No intersection
            T_VECTORS.push(circlePos); 
            T_VECTORS.push(edge); 
            T_VECTORS.push(point);
            return false;              
          } else if (response) {
            // It intersects, calculate the overlap.
            response['bInA'] = false;
            overlapN = point.normalize();
            overlap = radius - dist;
          }
        }
      // Otherwise, it's the middle region:
      } else {
        // Need to check if the circle is intersecting the edge,
        // Change the edge into its "edge normal".
        var normal = edge.perp().normalize();
        // Find the perpendicular distance between the center of the 
        // circle and the edge.
        var dist = point.dot(normal);
        var distAbs = Math.abs(dist);
        // If the circle is on the outside of the edge, there is no intersection.
        if (dist > 0 && distAbs > radius) {
          // No intersection
          T_VECTORS.push(circlePos); 
          T_VECTORS.push(normal); 
          T_VECTORS.push(point);
          return false;
        } else if (response) {
          // It intersects, calculate the overlap.
          overlapN = normal;
          overlap = radius - dist;
          // If the center of the circle is on the outside of the edge, or part of the
          // circle is on the outside, the circle is not fully inside the polygon.
          if (dist >= 0 || overlap < 2 * radius) {
            response['bInA'] = false;
          }
        }
      }
      
      // If this is the smallest overlap we've seen, keep it. 
      // (overlapN may be null if the circle was in the wrong Vornoi region).
      if (overlapN && response && Math.abs(overlap) < Math.abs(response['overlap'])) {
        response['overlap'] = overlap;
        response['overlapN'].copy(overlapN);
      }
    }
    
    // Calculate the final overlap vector - based on the smallest overlap.
    if (response) {
      response['a'] = polygon;
      response['b'] = circle;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    T_VECTORS.push(circlePos); 
    T_VECTORS.push(edge); 
    T_VECTORS.push(point);
    return true;
  }
  SAT['testPolygonCircle'] = testPolygonCircle;
  
  // Check if a circle and a polygon collide.
  //
  // **NOTE:** This is slightly less efficient than polygonCircle as it just
  // runs polygonCircle and reverses everything at the end.
  /**
   * @param {Circle} circle The circle.
   * @param {Polygon} polygon The polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testCirclePolygon(circle, polygon, response) {
    // Test the polygon against the circle.
    var result = testPolygonCircle(polygon, circle, response);
    if (result && response) {
      // Swap A and B in the response.
      var a = response['a'];
      var aInB = response['aInB'];
      response['overlapN'].reverse();
      response['overlapV'].reverse();
      response['a'] = response['b'];
      response['b'] = a;
      response['aInB'] = response['bInA'];
      response['bInA'] = aInB;
    }
    return result;
  }
  SAT['testCirclePolygon'] = testCirclePolygon;
  
  // Checks whether polygons collide.
  /**
   * @param {Polygon} a The first polygon.
   * @param {Polygon} b The second polygon.
   * @param {Response=} response Response object (optional) that will be populated if
   *   they interset.
   * @return {boolean} true if they intersect, false if they don't.
   */
  function testPolygonPolygon(a, b, response) {
    var aPoints = a['points'];
    var aLen = aPoints.length;
    var bPoints = b['points'];
    var bLen = bPoints.length;
    // If any of the edge normals of A is a separating axis, no intersection.
    for (var i = 0; i < aLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, a['normals'][i], response)) {
        return false;
      }
    }
    // If any of the edge normals of B is a separating axis, no intersection.
    for (var i = 0;i < bLen; i++) {
      if (isSeparatingAxis(a['pos'], b['pos'], aPoints, bPoints, b['normals'][i], response)) {
        return false;
      }
    }
    // Since none of the edge normals of A or B are a separating axis, there is an intersection
    // and we've already calculated the smallest overlap (in isSeparatingAxis).  Calculate the
    // final overlap vector.
    if (response) {
      response['a'] = a;
      response['b'] = b;
      response['overlapV'].copy(response['overlapN']).scale(response['overlap']);
    }
    return true;
  }
  SAT['testPolygonPolygon'] = testPolygonPolygon;

  return SAT;
}));
/// <reference path="linker.js" />

/*
    A place for generic math, set/get methods, and other small functions.
    Also used for global data structures, enums, and functions.
*/
var utils = (function () {
    var cboxMenu;


    return {
        /*
            extends an oldObj into a newObj
            while keeping certain objects properties in sync
        */
        extend: function (newObj, oldObj) {
            // merge-copy current oldObj into newObj
            $.extend(newObj, oldObj);

            // force newObj to get oldObj's imgReady property
            var prop = "imgReady";
            Object.defineProperty(newObj, prop, {
                get: function () {
                    return oldObj[prop];
                },
                //set: function (arg) {
                //    oldObj[prop] = arg;
                //},
                //configurable: true
            });

        },

        speed2scale: function(speed){
            return -0.5*speed + 2;
        },

        /*
            Returns a random float between a and b.

            @param(number) min The min floating point number.
            @param(number) max The max floating point number.
            @param(?number) precision The number of decimal precision places. (2 (hundredths place) by default)
        */
        randF: function(min, max, precision){
            if(typeof (precision) === "undefined") {
                precision = 2; // hundredths place
            }

            return parseFloat(Math.min(min + (Math.random() * (max - min)), max).toFixed(precision));
        },

        repeatAction: function (timeStep, numTimes, callback) {
            var num = 0;
            var theAnimation = setInterval(function () {
                if (num++ > numTimes) {
                    clearInterval(theAnimation);
                }
                else {
                    callback();
                }
            }, timeStep);
        },

        deathSequence: function(){
            if (!game.over) {
                game.over = true;

                audio.heroDeath.play();
                audio.bgMusic.muted = true;

                setTimeout(function () {
                    Graphics.fadeCanvas(function() {
                        if((hero.lives - 1) < 0) {
                            alert("You Lose");
                            location.reload();
                        }
                        else {
                            --hero.lives;
                        }


                        level.reset();
                        level.curLvl.deinit();
                        level.curLvl.init();

                        if (audio.isOn)
                            audio.bgMusic.muted = false;
                    });
                }, 2600);
            }
        },

        degToRad: function(deg){
            return deg * 0.0174532925199432957;
        },

        revFactorial: function(n){
            var count = 2;
            var result = n;

            while(result !== 1) {
                console.log(result + '/' + count + '=');
                result /= count;

                if(result === 0) {
                    return -1;
                }
                else if(result === 1) {
                    return count;
                }
                else {
                    ++count;
                }
            }
        },

        getTimeObj: function (t) {
            if (t === 0) {
                return { min: "00", sec: "00" };
            }
            
            var min = Math.floor(t / 60);
            var sec = t % 60;

            if (sec < 10) {
                sec = '0' + sec;
            }

            if (min < 10) {
                min = '0' + min;
            }

            return {
                min: min,
                sec: sec
            };
        },

        browser: function(){
            var ua = navigator.userAgent,
                     tem,
                     M = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*([\d\.]+)/i) || []
            ;

            if (/trident/i.test(M[1])) {
                tem = /\brv[ :]+(\d+(\.\d+)?)/g.exec(ua) || [];
                    return 'IE '+(tem[1] || '');
            }

            M = M[2]? [M[1], M[2]]:[navigator.appName, navigator.appVersion, '-?'];

            if ((tem = ua.match(/version\/([\.\d]+)/i)) != null)
                M[2] = tem[1];

            return M.join(' ');
        },

        /**** Debug Printers ****/
        // A method to print to the console less frequently then within the game loop.
        printSlow: function(msg){
            if (game.actualTime % 10 === 0) {
                console.log(msg);
            }
        },

		printMouse: function () {
		    $("canvas").on("mousemove", function (e) {
		        console.log(e.offsetX, e.offsetY);
		    });
		},

		printDir: function (dir) {
		    switch (dir) {
		        case 0:
		            console.log("Dir.NONE");
		            break;
		        case 1:
		            console.log("Dir.TOP");
		            break;
		        case 2:
		            console.log("Dir.BOT");
		            break;
		        case 3:
		            console.log("Dir.LEFT");
		            break;
		        case 4:
		            console.log("Dir.RIGHT");
		            break;
		        case 5:
		            console.log("Dir.IN");
		            break;
		        default:
		            console.log("Dir.unknown");
		    }
		},

		toggleMenu: function () {

		    if ($("#colorbox").css("display") === "block") {
		        cboxMenu.colorbox.close();
		    }
		    else {
		        cboxMenu = $.colorbox({
		            html: $(".gameInstructions").html(),
		            width: 320,
		            height: 530
		        });
		    }
		},

		toggleFullScreen: function () {


		    // fill browser window
		    if ($("body").hasClass("fullscreen")) {
		        $(".canvasWrap").css({
		            width: "",
		            marginLeft: ""
		        });

		        $("body").removeClass("fullscreen");
		    }
		    else {
		        $("body").addClass("fullscreen");

		        var scaledW = $(window).height() * 1.777778;

		        $(".canvasWrap").css({
		            width: scaledW,
		            marginLeft: -scaledW / 2
		        });
		    }



            // fullscreen API
            //if (!document.fullscreenElement &&    // alternative standard method
            //    !document.mozFullScreenElement && !document.webkitFullscreenElement) {  // current working methods

            //    if (canvas.requestFullscreen) {
            //        canvas.requestFullscreen();
            //    }
            //    else if (canvas.mozRequestFullScreen) {
            //        canvas.mozRequestFullScreen();
            //    }
            //    else if (canvas.webkitRequestFullscreen) {
            //        canvas.webkitRequestFullscreen(); //Element.ALLOW_KEYBOARD_INPUT
            //    }
            //}
            //else {
            //    if (document.cancelFullScreen) {
            //        document.cancelFullScreen();
            //    }
            //    else if (document.mozCancelFullScreen) {
            //        document.mozCancelFullScreen();
            //    }
            //    else if (document.webkitCancelFullScreen) {
            //        document.webkitCancelFullScreen();
            //    }
            //}
        }

	};
})();


// global enums
var Dir = Object.freeze({
    NONE: 0,
    TOP: 1,
    BOT: 2,
    LEFT: 3,
    RIGHT: 4,
    IN: 5,
    UP: 6,
    DOWN: 7,
    UP_RIGHT: 8,
    DOWN_RIGHT: 9
});

var Color = Object.freeze({
    LIGHT_BROWN: "#c44525",
    DARK_BROWN: "#672819",
    LIGHT_GREEN: "#166a38",
    SILVER: "#c0c0c0",
    BLACK: "#000",
    GOLD: "#ddaa13",
    ORANGE: "#ff6a00"
});

// global functions
window.requestAnimFrame = (function () {
    return window.requestAnimationFrame ||
		   window.webkitRequestAnimationFrame ||

		   function (callback) {
		       setTimeout(callback, 16.6666666667); // 60fps fallback
		   };
})();

var audio = (function () {

    return {
        bgMusic: new Audio("audio/firstChiptune/firstChiptune.mp3"),
        enterSound: new Audio("audio/synthetic_explosion_1.mp3"),
        exitSound: new Audio("audio/annulet.mp3"),
        itemPickedUp: new Audio("audio/life_pickup.mp3"),
        heartbeat: new Audio("audio/heartbeat.mp3"),
        jump: new Audio("audio/jump.mp3"),
        thud: new Audio("audio/thud.mp3"),
        step: new Audio("audio/step.mp3"),
        effort: new Audio("audio/woosh.mp3"),
        discovery: new Audio("audio/spell3.mp3"),
        enemyDeath: new Audio("audio/death.mp3"),
        heroDeath: new Audio("audio/DiscsOfTron_Cascade.mp3"),
        enchant: new Audio("audio/enchant.mp3"),
        isOn: false,


        init: function(){
            audio.bgMusic.loop = true;
            audio.bgMusic.volume = 0.7;
            audio.bgMusic.pause();

            audio.enemyDeath.volume = 0.6;
            audio.jump.volume = 0.4;
            audio.thud.volume = 0.78;
            audio.discovery.volume = 0.7;

            audio.mute(true);
            $(document).on("click", ".audioState", audio.handleMuteButton);

            $(".menu").on("click", function (e) {
                e.preventDefault();
                utils.toggleMenu();
            })

            //----- enable audio on start -----
            audio.handleMuteButton()
        },

        lvlComplete: function () {
            audio.bgMusic.pause();

            var newBgMusic;
            
            switch(game.lvl) {
                case 0:
                    audio.enterSound.play();
                    newBgMusic = "inspiredBySparkMan/sparkBoy.mp3";
                    break;
                default:
                    audio.exitSound.play();
                    newBgMusic = "sweetAcoustic.mp3";
                    break;
            }

            setTimeout(function () {
                audio.bgMusic = new Audio("audio/" + newBgMusic);
                audio.bgMusic.loop = true;
                audio.bgMusic.volume = 0.45;

                audio.isOn ?
                    audio.bgMusic.play() :
                    audio.bgMusic.pause();
            }, 1000);
        },

        play: function (sound, stopPrev) {
            stopPrev = (typeof (stopPrev) !== "undefined") ? stopPrev : true;

            if (sound.ended)
                sound.play();
            else {
                if (stopPrev || sound.currentTime === 0) {
                    sound.pause();
                    sound.currentTime = 0;
                    sound.play();
                }
            }
        },

        handleMuteButton: function () {
            if ($('.audioState').hasClass('off')) {
                $('.audioState span').removeClass('icon-volume-mute').addClass('icon-volume-medium');
                $('.audioState').removeClass('off');
                $('.audioState').addClass('on');

                audio.mute(false);
            }
            else {
                $('.audioState span').removeClass('icon-volume-medium').addClass('icon-volume-mute');
                $('.audioState').removeClass('on');
                $('.audioState').addClass('off');

                audio.mute(true);
            }
        },

        mute: function (onOrOff) {
            audio.discovery.muted =
            audio.enterSound.muted =
            audio.bgMusic.muted =
            audio.itemPickedUp.muted =
            audio.heartbeat.muted =
            audio.effort.muted = 
            audio.thud.muted = 
            audio.jump.muted = 
            audio.step.muted = 
            audio.enemyDeath.muted =
            audio.heroDeath.muted =
            audio.enchant.muted =
            audio.exitSound.muted =
                onOrOff;

            onOrOff ?
                audio.bgMusic.pause() :
                audio.bgMusic.play();

            audio.isOn = !onOrOff;
        }
    };
})();

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

/// <reference path="../linker.js" />

var HUD = (function () {

    var cash = null,
        medKit = null,
        shuriken = null,
        syringe = null
    ;


    function drawHealth(){
        for(var i=0; i < hero.health; ++i){
            ctx.fillStyle = "red";
            ctx.fillRect(77 + i*21, FULLH + 8, 19, 8);
        }
    }
	
    function drawMana(){
        for(var i=0; i < hero.mana; ++i){
            ctx.fillStyle = "#00b6ff";
            ctx.fillRect(77 + i*21, FULLH + 26, 19, 8);
        }
    }
	
    function drawXP() {
        ctx.fillStyle = "#ddd";
        ctx.font = "12px 'Press Start 2P'";
        	
        var zero = (hero.xp < 10) ? '0' : '';
        ctx.fillText(zero + hero.xp + '/' + hero.xpNeeded, 77, FULLH + 54);
    }


    return {
        init: function () {
            // HUD icons
            cash = new GameObj(JQObject.EMPTY, 548, FULLH + 20, 22, 24, "cash.png");
            medKit = new GameObj(JQObject.EMPTY, 238, FULLH + 15, 31, 30, "medKit.png");
            shuriken = new GameObj(JQObject.EMPTY, 447, FULLH + 15, 31, 31, "shuriken.png");
            syringe = new GameObj(JQObject.EMPTY, 342, FULLH + 18, 25, 25, "syringe.png");
        },

        draw: function () {// TODO: break out static parts
            // background
            ctx.fillStyle = "#070707";
            ctx.fillRect(0, FULLH, FULLW, game.padHUD);

            ctx.fillStyle = "#ddd";
            ctx.font = "11px 'Press Start 2P'";


            ctx.fillText("HP-" + hero.healthLvl, 7, FULLH + 18);
            ctx.fillText("MP-" + hero.manaLvl, 7, FULLH + 37);
            ctx.fillText("XP", 7, FULLH + 54);
            
            drawHealth();
            drawMana();
            drawXP();

            // hp kit
            ctx.fillText(hero.medKits, 210, FULLH + 37);
            medKit.draw();

            // mp kit
            ctx.fillText(hero.manaKits, 315, FULLH + 37);
            syringe.draw();

            // ammo
            ctx.fillText(hero.ammo, 410, FULLH + 37);
            shuriken.draw();

            // money
            ctx.fillText(hero.cash, 515, FULLH + 37);
            cash.draw();

            // lives
            ctx.fillText("LIVES x" + hero.lives, 700, FULLH + 37);

            // time
            var time = utils.getTimeObj(game.actualTime);
            ctx.fillText(time.min + ':' + time.sec, FULLW - 78, FULLH + 24);
        }
    };
})();

/// <reference path="../linker.js" />

var JQEnemy = Object.freeze({
    STILL: 0,
    PATROL: 1,
    FOLLOW: 2
});


/*
    Enemy extends GameObj

    @param(GameObj) gObj A game object (super class).
    @param(EnemyType) enemy_t The type of the enemy.
    @param(number) health The hp of the enemy.
    @param(number) leftXBound The left x coordinate boundary.
    @param(number) rightXBound The right x coordinate boundary.
    @param(bool?) active Is the enemy allowed to move?
    @constructor
*/
var Enemy = function (gObj, enemy_t, health, leftXBound, rightXBound, active) {
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
            if (this.deadOnScreen) {
                ctx.globalAlpha = 0.3;
            }

            parentDraw.apply(this);
            ctx.restore();
        }
    }
};

Enemy.prototype = {

    update: function () {
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
        if (this.enemy_t === JQEnemy.PATROL) {
            if (this.pos.x + hero.lvlX <= this.leftXBound)
                this.dir = Dir.RIGHT;
            else if (this.pos.x + hero.lvlX >= this.rightXBound)
                this.dir = Dir.LEFT;

            if (this.dir === Dir.RIGHT) {
                ++this.pos.x;
            }
            else {
                --this.pos.x;
            }
        }
        else if (this.enemy_t === JQEnemy.FOLLOW) {
            if (this.pos.x < hero.pos.x)
                ++this.pos.x;
            else if (this.pos.x > hero.pos.x)
                --this.pos.x;
        }
    },

    death: function () {
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
/// <reference path="../linker.js" />

var level = (function () {

    var maxVy = 10; // applys to GameObj's and GameItem's


    /********** Update **********/
    function updateObjsView() {
        for (var i = 0; i < level.objs.length; ++i) {
            level.objs[i].pos.x -= hero.vX;

            if(level.objs[i].type === JQObject.SCALEBG) {
                level.objs[i].x2 -= hero.vX;
            }

        }
    }

    function updateItemsView() {
        for (var i = 0; i < level.items.length; ++i) {
            level.items[i].pos.x -= hero.vX;
        }
    }

    function updateBgView() {
        // color layer
        level.bgColor.gradX -= hero.vX;
        level.bgColor.fillStyle = Graphics.getDoorBgGrad();

        // objects
        for(var i = 0; i < level.bg.length; ++i) {
            level.bg[i].pos.x -= hero.vX / level.bg[i].speed;
        }

    }

    function updateEnemiesView() {
        for (var i = 0; i < level.enemies.length; ++i) {
            level.enemies[i].pos.x -= hero.vX;
        }
    }


    function updateItems() {
        for (var i = 0; i < level.items.length; ++i) {
            if (level.items[i].visible && !level.items[i].isOnObj) {
                // gravity/position
                if (level.items[i].vY < maxVy)
                    level.items[i].vY += game.gravity;
                else
                    level.items[i].vY = maxVy;

                // obj collision
                Physics.testObjObjs(level.items[i], function(r) {
                    // a is level.items[i]
                    // b is in level.objs

                    r.a.pos.x -= r.overlapV.x;
                    r.a.pos.y -= r.overlapV.y;

                    if (r.overlapN.y === 1) {    // on top of platform
                        audio.thud.play();

                        r.a.vY = (r.b.type === JQObject.ELEVATOR) ? r.b.vY : 0;
                        r.a.isOnObj = true;
                        r.a.onObj = r.b;
                        r.a.recentlyHeld = false;

                        if(r.b.type === JQObject.SCALE && r.b.holdingItem === null) {
                            r.a.grabbable = false;
                            r.b.holdingItem = r.a;

                            utils.repeatAction(42, 14, function () {
                                if(r.b.side === Dir.LEFT) {
                                    ++r.a.pos.y;
                                    ++r.b.pos.y;

                                    ++r.b.hBar.pos.y;

                                    --r.b.otherSide.pos.y;
                                    --r.b.hBar.y2;

                                    if(r.b.otherSide.holdingItem !== null) {
                                        --r.b.otherSide.holdingItem.pos.y;
                                        // TODO: chain of crates on top
                                    }
                                }
                                else {
                                    ++r.a.pos.y;
                                    ++r.b.pos.y;

                                    ++r.b.hBar.y2;

                                    --r.b.hBar.pos.y;
                                    --r.b.otherSide.pos.y;

                                    if(r.b.otherSide.holdingItem !== null) {
                                        --r.b.otherSide.holdingItem.pos.y;
                                        // TODO: chain of crates on top
                                    }
                                }

                            });
                        }
                    }

                });

                // item collision
                Physics.testItemItems(level.items[i], function (r) {
                    r.a.isOnObj = true;
                    r.a.onObj = r.b;
                    r.b.grabbable = false;
                    r.a.recentlyHeld = false;
                });
            }

            if(typeof (level.items[i].onObj) !== "undefined" && level.items[i].onObj !== null) {
                level.items[i].vY = (level.items[i].onObj.type === JQObject.ELEVATOR) ? level.items[i].onObj.vY : 0;
            }

            level.items[i].pos.y += level.items[i].vY;
        }
    }

    function updateEnemies() {
        for (var i = 0; i < level.enemies.length; ++i) {
            level.enemies[i].update();

            // TODO: move to hero??

            if(level.enemies[i].health > 0) {
                // hero and enemy
                if(SAT.testPolygonPolygon(hero, level.enemies[i])) {
                    level.enemies[i].active = true;

                    if(!hero.invincible) {
                        audio.play(audio.heartbeat, true);

                        hero.invincible = true;
                        --hero.health;
                    }
                }

                // projectiles and enemy
                for (var j = 0; j < hero.bulletArr.length; ++j) {
                    if(SAT.testPolygonPolygon(hero.bulletArr[j], level.enemies[i])) {
                        audio.play(audio.thud, true);
                        level.enemies[i].active = true;

                        hero.bulletArr.splice(j, 1); // remove jth item
                        --level.enemies[i].health;

                        if (level.enemies[i].health <= 0) {
                            level.enemies[i].death();
                        }
                    }
                }
            }
        }
    }

    /********** Render **********/
    // the parallax background
    function drawBg() {
        // color background
        ctx.fillStyle = "#000";
        ctx.fillRect(0, FULLH - game.padFloor, FULLW, game.padFloor);
        ctx.fillStyle = level.bgColor.fillStyle;
        ctx.fillRect(0, 0, FULLW, FULLH - game.padFloor);

        // background objects
        for (var i = 0; i < level.bg.length; ++i) {
            //level.bg[i].draw();
            var t = level.bg[i];
            var scale = utils.speed2scale(t.speed);

            ctx.drawImage(t.img, t.pos.x, t.pos.y, t.w * scale, t.h * scale);
        }
    }

    // all of the collision rectangles in the level
    function drawObjs() {
        for (var i = 0; i < level.objs.length; ++i) {
            var obj = level.objs[i];

            // check if visible; TODO: all objs should have visible property (fix api)
            if (typeof (obj.visible) !== "undefined" && !obj.visible) {
                continue;
            }
            

            if(obj.type === JQObject.LADDER) {           // ladder
                Graphics.drawLadder(obj);
            }
            else if(obj.type === JQObject.SCALE) {       // scale
                Graphics.drawScale(obj);
                Graphics.drawPlatformStatus(obj);
            }
            else if(obj.type === JQObject.PLATFORM || obj.type === JQObject.SLOPE || obj.type === JQObject.ELEVATOR) {
                Graphics.drawPlatform(obj);
            }
            else if(obj.type === JQObject.DOOR) {
                Graphics.drawDoor(obj);
            }
            else if(obj.type === JQObject.POLY) {
                Graphics.drawPoly(obj);
            }
            else if(obj.type === JQObject.HILL) {
                Graphics.drawHill(obj);
            }
            else {
                obj.draw();
            }
        }
    }

    function drawItems() {
        for (var i = 0; i < level.items.length; ++i) {
            level.items[i].draw();
        }
    }

    function drawEnemies() {
        for (var i = 0; i < level.enemies.length; ++i) {
            if (!level.enemies[i].deadOffScreen) {
                level.enemies[i].draw();
            }
        }
    }


    return {
        bgColor: {},
        bg: [],             // dynamically holds all of the background objects for the level
        objs: [],           // dynamically holds all of the objects for the level
        items: [],          // dynamically holds all of the items for the level
        enemies: [],        // dynamically holds all of the enemies for the level
        curLvl: null,       // alias for the current level object e.g. lvl1
        isCutscene: false,
        time: 0,
        hiddenItemsFound: 0,
        hiddenItems: 0,
        isTransitioning: false,
        

        init: function() {
            level.reset();
            level.curLvl = new StartScreen();     // level '0'
        },

        // called before start of level
        reset: function () {
            // reset game stats
            game.over = false;
            game.actualTime = 0;

            // reset level
            level.hiddenItemsFound = 0;
            hero.lvlX = 0;
            level.bgColor = {
                fillStyle: "#000"
            };
            level.bg = [];
            level.objs = [];
            level.items = [];
            level.enemies = [];

            // reset hero
            hero.pos.x = 23;
            hero.pos.y = FULLH - game.padFloor - hero.h + 4;    // TODO: find out '4' offset??
            hero.vX = hero.vY = 0;
            hero.isJumping = false;
            hero.ammo = 20;
            hero.bulletArr.length = 0;		// prevents leftover thrown shurikens
            hero.invincible = false;
            hero.isHolding = false;
            hero.curItem = null;
            hero.dir = Dir.RIGHT;
            hero.health = hero.maxHealth;
        },

        // called at end of level
        complete: function () {
            level.isTransitioning = true;
            audio.lvlComplete();

            // reset graphics timers (to fix blink text)
            Graphics.ticker = 1;
            Graphics.fadeOut = true;

            Graphics.fadeCanvas(function () {
                level.isTransitioning = false;

                level.curLvl = lvlComplete;
                level.isCutscene = true;
                level.time = game.actualTime;

                // TODO: audio.lvlCompleted.play()
            });
        },

        /******************** Update ********************/
        update: function () {
            if (!level.isTransitioning) {
                updateItems();
                updateEnemies();

                level.curLvl.update();
            }
        },

        // fix positions relative to the "camera" view
        updateView: function(){
            updateObjsView();
            updateItemsView();
            updateBgView();
            updateEnemiesView();
        },


        /******************** Render ********************/
        render: function () {
            drawBg();
            drawObjs();
            drawItems();
            drawEnemies();
            
            level.curLvl.render();
        }
    };
})();

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

/// <reference path="../linker.js" />

// level '0'
function StartScreen() {
    this.width = FULLW;

    level.isCutscene = true;
}

StartScreen.prototype = (function() {
    var copyTitle1 = "JON'S",
        copyTitle2 = "QUEST",
        copyLine = String.fromCharCode("169") + " 2013 JON WIEDMANN"
    ;

    return {
        update: function(){
            if (lastKeyDown === KeyCode.ENTER) {
                level.complete();
            }
        },

        render: function(){
            //---- title

            // title 1
            ctx.font = "29px 'Press Start 2P'";
            var startX = HALFW - ctx.measureText(copyTitle1).width / 2 + 11,
                startY = 58;

            ctx.setTransform(1, 0, -0.4, 1.4, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('J', startX + 4, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('J', startX, startY);
            ctx.setTransform(1, 0, -0.2, 1.4, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('O', startX + 32, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('O', startX + 28, startY);
            ctx.setTransform(1, 0, 0.05, 1.41, 0, -1);
            ctx.fillStyle = "#222";
            ctx.fillText('N', startX + 58, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('N', startX + 54, startY);
            ctx.setTransform(1, 0, 0.23, 1.4, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText("'", startX + 78, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText("'", startX + 74, startY);
            ctx.setTransform(1, 0, 0.42, 1.4, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('S', startX + 95, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('S', startX + 91, startY);


            // title 2
            ctx.font = "36px 'Press Start 2P'";
            startX = HALFW - ctx.measureText(copyTitle2).width / 2 + 30;
            startY = 98;

            ctx.setTransform(1, 0, -0.5, 1.6, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('Q', startX + 4, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('Q', startX, startY);
            ctx.setTransform(1, 0, -0.25, 1.6, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('U', startX + 26, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('U', startX + 22, startY);
            ctx.setTransform(1, 0, 0.03, 1.6, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('E', startX + 50, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('E', startX + 46, startY);
            ctx.setTransform(1, 0, 0.25, 1.6, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('S', startX + 74, startY + 3);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('S', startX + 70, startY);
            ctx.setTransform(1, 0, 0.5, 1.6, 0, 0);
            ctx.fillStyle = "#222";
            ctx.fillText('T', startX + 90, startY + 4);
            ctx.fillStyle = "#ff6a00";
            ctx.fillText('T', startX + 86, startY);
            ctx.setTransform(1, 0, 0, 1, 0, 0);	// reset

            //---- press enter
            Graphics.blinkText(22, HALFW, HALFH + 81);

            //---- copyright
            ctx.fillStyle = "#000";
            ctx.fillRect(0, FULLH, FULLW, game.padHUD);
            ctx.font = "13px 'Press Start 2P'";
            ctx.fillStyle = "#c9c9c9";

            ctx.fillText(copyLine, HALFW - ctx.measureText(copyLine).width / 2, FULLH + 24);
        }
    };
})();

/// <reference path="../linker.js" />

var lvl1 = (function () {

    var hiddenCash,
		door,
        ladder,
        doLadder = false,
        theScale = {}
    ;

    function setBackground() {
        //---- color layer
        level.bgColor.gradX = door.pos.x + door.w/2;
        level.bgColor.gradY = door.pos.y + door.h/2;

        level.bgColor.fillStyle = Graphics.getDoorBgGrad();

        //---- objects
        Graphics.setClouds();
    }

    function setObjs() {
        // floor + 3 initial platforms
        level.objs.push(
            new GameObj(JQObject.PLATFORM, -Graphics.projectX, FULLH - game.padFloor - 1, lvl1.width + Graphics.projectX * 2, game.padFloor + 1),
            new GameObj(JQObject.PLATFORM, 200, 206, 267, 62),
            new GameObj(JQObject.PLATFORM, 575, 310, 300, 62),
            new GameObj(JQObject.PLATFORM, 605, 125, 220, 62)
        );

        // scales
        theScale = Graphics.getScale(1500, FULLH - game.padFloor - 137);
        level.objs.push(theScale.vBar, theScale.hBar, theScale[Dir.LEFT], theScale[Dir.RIGHT]);


        // stairs, platform, and door
        var stairs = new GameObj(JQObject.SLOPE, 2143, 208, 252, 62, null, Dir.UP_RIGHT);
        var doorPlat = new GameObj(JQObject.PLATFORM, stairs.pos.x + stairs.w - 11, stairs.pos.y - stairs.h - 5, 200, 62);
        door = new GameObj(JQObject.DOOR, doorPlat.pos.x + doorPlat.w - 63, doorPlat.pos.y - 62 - Graphics.projectY / 2, 33, 62);
        level.objs.push(doorPlat, stairs, door);

        // TODO: move to setItems() ??
        ladder = new GameItem(new GameObj(JQObject.LADDER, stairs.pos.x - 37, stairs.pos.y - 1, 38, FULLH - stairs.pos.y - game.padFloor), false, 0, false);
        ladder.collidable = false;      // allows ladder to not be in normal collision detection
        level.objs.push(ladder);

    }

    function setItems() {        // crates        var crate = [];        for (var i = 0; i < 3; ++i) {
            crate.push(
                new GameItem(
                    new GameObj(JQObject.CRATE, 446, FULLH - game.padFloor - 26 + 5, 34, 37, "crate.png"),
                    true
                )
            );
        }
        crate[1].pos.x = theScale[Dir.LEFT].pos.x + theScale[Dir.LEFT].w / 2 - crate[0].w / 2;
        crate[2].pos.x = theScale[Dir.RIGHT].pos.x + theScale[Dir.RIGHT].w / 2 - crate[0].w / 2;        // sack
        var sack = new GameItem(new GameObj(JQObject.SACK, 680, 111 + Graphics.projectY / 2, 30, 34, "sack.png"), false, 5);

        // hidden cash; TODO: only add to level.items after visible???
        hiddenCash = new GameItem(new GameObj(JQObject.CASH, 113, 80, 22, 24, "cash.png"), false, 10, false);

        level.items.push(crate[0], crate[1], crate[2], sack, hiddenCash);
    }

    function setEnemies() {
        var cyborg = new Enemy(
            new GameObj(JQObject.ENEMY, 1200, FULLH - game.padFloor - 55 + Graphics.projectY/2, 40, 55, "cyborgBnW.png"),
            JQEnemy.FOLLOW,
            1,
            1087,
            1600,
            false
        );
        cyborg.collidable = false;  // TODO: fix api        level.enemies.push(cyborg);
    }


    return {
        width: 2650,


        init: function () {
            level.hiddenItems = 1;
            setObjs();            setItems();
            setEnemies();

            setBackground();
        },

        deinit: function(){
            hiddenCash = null;
            door = null;
            ladder = null;
            doLadder = false;
        },

        update: function () {
            // TODO: move to better location
            if (window.DEBUG) {
                level.complete();
            }

            if(doLadder) {
                hero.onLadder = SAT.testPolygonPolygon(hero, ladder);
            }
            else {
                doLadder = Physics.handleScale();
            }

            // hidden cash
            if (!hiddenCash.visible) {
                for (var i = 0; i < hero.bulletArr.length; ++i) {
                    if (Physics.isCollision(hero.bulletArr[i], hiddenCash, -17)) {
                        hiddenCash.visible = true;
                        audio.discovery.play();
                        ++level.hiddenItemsFound;
                    }
                }
            }

            // door
            if (!game.over && Physics.isCollision(hero, door, 0)) {     // TODO: why checking game.over???
                level.complete();
            }
        },

        render: function() {
            Graphics.drawScaleBg(theScale);
        }
    };

})();

/// <reference path="../linker.js" />

var lvl2 = (function () {

    var floor1,
        hill,
        floorPlat,
        colL,
        colR,
        bridge,
        elevator = [],
        wall,
        slope,
        ladder,
        door,
        enemy2hotspot,
        enemy2,
        fireball = null,
        theScale = {},
        doRevive = false,
        doLadder = false
    ;


    function setBackground() {
        level.bgColor.gradX = door.pos.x;
        level.bgColor.gradY = door.pos.y;

        level.bgColor.fillStyle = Graphics.getDoorBgGrad();
        Graphics.setClouds();
    }

    function setObjs() {
        floor1 = new GameObj(JQObject.PLATFORM, -Graphics.projectX, FULLH - game.padFloor, FULLW - 250, game.padFloor);
        hill = new GameObj(JQObject.HILL, 200, FULLH - game.padFloor, 320, 60);
        floorPlat = new GameObj(JQObject.PLATFORM, floor1.pos.x + floor1.w - Graphics.projectX, floor1.pos.y - floor1.h - 30, 1000, 180);
        colL = new GameObj(JQObject.PLATFORM, floorPlat.pos.x + 240, floorPlat.pos.y - 90 + Graphics.projectY, 100, 85);
        colR = new GameObj(JQObject.PLATFORM, floorPlat.pos.x + floorPlat.w - 100, floorPlat.pos.y - 90 + Graphics.projectY, 100, 85);
        bridge = new GameObj(JQObject.PLATFORM, colL.pos.x + 140, colL.pos.y - 137, 480, 30);

        level.objs.push(floorPlat, floor1, hill,colL, colR, bridge);

        // elevators
        for(var i = 0; i < 3; ++i) {
            elevator[i] = new GameObj(JQObject.ELEVATOR, colR.pos.x + 237 + i * 300, colR.pos.y - i*80, 115, 26);
            elevator[i].dir = Dir.DOWN;
            level.objs.push(elevator[i]);
        }

        wall = new GameObj(JQObject.PLATFORM, elevator[2].pos.x + elevator[2].w + 120, 190, 100, FULLH - 190);
        slope = new GameObj(JQObject.SLOPE, wall.pos.x + wall.w - Graphics.projectX, wall.pos.y, 900, FULLH - 190, null, Dir.DOWN_RIGHT);
        
        var platty = new GameObj(JQObject.PLATFORM, slope.pos.x + slope.w - Graphics.projectX - 1, FULLH - game.padFloor, 1000, game.padFloor);

        theScale = Graphics.getScale(platty.pos.x + 250, FULLH - game.padFloor - 137);
        level.objs.push(theScale.hBar, theScale.vBar, theScale[Dir.LEFT], theScale[Dir.RIGHT]);

        ladder = new GameObj(JQObject.LADDER, platty.pos.x + platty.w - Graphics.projectX - 30, 140, 30, FULLH - 140 - game.padFloor);
        ladder.visible = false;
        ladder.collidable = false;

        var platty2 = new GameObj(JQObject.PLATFORM, ladder.pos.x + ladder.w, 140, 350, game.padFloor);

        door = new GameObj(JQObject.DOOR, platty2.pos.x + platty2.w - 90, platty2.pos.y - 100, 40, 100);

        level.objs.push(platty, slope, wall, platty2, door, ladder);
    }

    function setItems() {
        var crate = new GameItem(new GameObj(JQObject.CRATE, bridge.pos.x + bridge.w / 2 - 80, bridge.pos.y - 37, 34, 37, "crate.png"), true);
        var crate2 = new GameItem(new GameObj(JQObject.CRATE, bridge.pos.x + bridge.w / 2 + 80, bridge.pos.y - 37, 34, 37, "crate.png"), true);
                    
        var sack = new GameItem(
            new GameObj(JQObject.SACK, colL.pos.x + 300, 302, 30, 36, "sack.png"),
            true,
            5
        );

        level.items.push(sack, crate, crate2);
    }

    function setEnemies() {
        var enemy = new Enemy(
            new GameObj(JQObject.ENEMY, colL.pos.x + colL.w, 404, 40, 55, "cyborgBnW.png"),
            JQEnemy.PATROL,
            1,
            colL.pos.x + colL.w,
            colR.pos.x - 55/2,
            true
        );
        enemy.collidable = true;        // TODO: fix api
        level.enemies.push(enemy);

        enemy2 = getEnemy2();

        enemy2hotspot = new GameObj(JQObject.EMPTY, enemy2.pos.x, enemy2.pos.y, enemy2.w, enemy2.h);
        enemy2hotspot.collidable = false;
        enemy2hotspot.visible = false;
        level.objs.push(enemy2hotspot);

        level.enemies.push(enemy2);
    }

    function getEnemy2() {
        en = new Enemy(
            new GameObj(JQObject.ENEMY, wall.pos.x + 35, wall.pos.y - 55, 40, 55, "cyborgBnW.png"),
            //new GameObj(JQObject.ENEMY, 135, FULLH - game.padFloor - 55, 40, 55, "cyborgBnW.png"),
            JQEnemy.STILL,
            5
        );
        en.collidable = true;

        return en;
    }

    function handleFireball() {
        // enemy2hotspot
        if((enemy2hotspot.pos.x + enemy2hotspot.w) >= 0 && (enemy2hotspot.pos.x + enemy2hotspot.w) <= FULLW) {
            // revive enemy2
            if(doRevive) {
                doRevive = false;
                enemy2.revive();
            }

            // shoot fireball
            if(enemy2.alive && fireball === null) {
                var dir;
                
                if(hero.pos.x < enemy2.pos.x)
                    dir = Dir.LEFT;
                else
                    dir = Dir.RIGHT

                fireball = new GameObj(JQObject.FIREBALL, enemy2.pos.x, enemy2.pos.y, 20, 20, null, dir);
                fireball.tag = level.objs.length;
                fireball.collidable = false;
                level.objs.push(fireball);
            }
        }
        else if(!enemy2.alive){
            doRevive = true;
        }

        // update position
        if(fireball !== null) {
            if(fireball.dir === Dir.LEFT) {
                --fireball.pos.x;
            }
            else {
                ++fireball.pos.x;
            }

            if(fireball.pos.x <= 0 || fireball.pos.x >= FULLW) {
                level.objs.splice(fireball.tag, 1);
                fireball = null;
            }
        }

        // test collision
        if(!hero.invincible && fireball !== null && SAT.testPolygonPolygon(hero, fireball)) {
            level.objs.splice(fireball.tag, 1);
            fireball = null;
            audio.play(audio.heartbeat, true);

            hero.invincible = true;
            --hero.health;
        }
    }

    return {
        width: 5030,


        init: function () {
            level.hiddenItems = 0;

            setObjs();
            setItems();
            setEnemies();

            setBackground();
        },

        deinit: function(){
            doLadder = false;
        },

        update: function() {
            // elevators
            for(var i = 0; i < elevator.length; ++i) {
                if(elevator[i].dir === Dir.UP && elevator[i].pos.y < 100) {
                    elevator[i].dir = Dir.DOWN;
                }
                else if(elevator[i].dir === Dir.DOWN && elevator[i].pos.y > 400) {
                    elevator[i].dir = Dir.UP;
                }

                elevator[i].vY = (elevator[i].dir === Dir.DOWN) ? 1 : -1;   // used by hero
                elevator[i].pos.y += elevator[i].vY;
            }
            
            // fireball
            handleFireball();

            // ladder
            if(doLadder) {
                hero.onLadder = SAT.testPolygonPolygon(hero, ladder);
            }
            else {
                doLadder = Physics.handleScale();
            }

            // door
            if(SAT.testPolygonPolygon(hero, door)) {
                level.complete();
            }
        },

        render: function() {
            Graphics.drawScaleBg(theScale);
        }
    };
})();
/// <reference path="../linker.js" />

function Level3() {
    this.init();
}

Level3.prototype = (function() {

    function setObjects(){
        var floor = new GameObj(JQObject.FLOOR, -Graphics.projectX, FULLH - game.padFloor, 1000, game.padFloor);
        level.objs.push(floor);
    }

    return {
        width: 2400,


        init: function() {
            level.hiddenItems = 0;

            setObjects();
            //setItems();
            //setEnemies();

            //setBackground();
        },

        deinit: function() {

        },

        update: function() {

        },

        render: function() {
            ctx.fillStyle = "#fff";
            ctx.fillText("LEVEL 3 -- COMING SOON", 300, 300);
            
        }
    };
})();

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
		}

		if (hero.idleTime > 210) {
		    var foo = hero.idleTime % 200;
		    
		    if (foo >= 0 && foo <= 50 || foo > 100 && foo <= 150 || hero.isHolding)
		        pos = spriteArr["playerDown"];
		    else if (foo > 50  && foo <= 100)
		        pos = spriteArr["playerDown_breatheIn"];
		    else if (foo > 150 && foo <= 200)
		        pos = spriteArr["playerDown_breatheOut"];
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
			img.src = "/games/common/img/sprites/player/player.png";
			
			// grab texturePacker's sprite coords
			$.get("/games/common/img/sprites/player/player.xml", function(xml){
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

/// <reference path="../linker.js" />

// The physics component of hero.
var HeroPhysicsComponent = function () {

    /*
        Updates projectiles position.

        Tests for projectile collision against screen.
        Tests for projectile collision against objects.
    */
    function projectileHandler() {
        for (var i = 0; i < hero.bulletArr.length; ++i) {
            hero.bulletArr[i].pos.x += hero.bulletArr[i].dirR ? Shuriken.speed : -Shuriken.speed;   // update position

            if (hero.bulletArr[i].pos.x > FULLW || hero.bulletArr[i].pos.x < 0) {		    // projectile and screen
                hero.bulletArr.splice(i, 1); // remove ith item
            }
            else {
                Physics.testObjObjs(hero.bulletArr[i], function(){                  // projectile and objects
                    hero.bulletArr.splice(i, 1);
                });
            }
        }
    }

    function screenCollision() {
        if (hero.pos.y < -hero.h*2) {                 // feet 2x above top of screen
            hero.pos.y = -hero.h*2;
            hero.vY = 0;
        }
        else if (hero.pos.y >= FULLH + hero.h*2) {  // 2x below bottom of screen
            if (!game.over) {
                utils.deathSequence();
            }
        }

        if (hero.pos.x < 0) { 						// left
            hero.pos.x = 0;
            hero.vX = 0;
        }
        else if (hero.pos.x > (FULLW - hero.w)) { 	// right 
            hero.pos.x = FULLW - hero.w;
            hero.vX = 0;
        }
    }

    function levelCollision() {
        hero.isOnObj = false;   // prevents jumping after walking off platform

        Physics.testObjObjs(hero, function(r) {
            // alias the collision direction
            var dir = {
                x: Dir.NONE,
                y: Dir.NONE
            };

            if(r.overlapN.y === 1)
                dir.y = Dir.TOP;
            else if(r.overlapN.y === -1)
                dir.y = Dir.BOT;

            if(r.overlapN.x === 1)
                dir.x = Dir.LEFT;
            else if(r.overlapN.y === -1)
                dir.x = Dir.RIGHT;


            // check object type
            if(r.b.type === JQObject.SLOPE || r.b.type === JQObject.POLY || r.b.type === JQObject.HILL) {
                //r.a.pos.x -= r.overlapV.x;

                if(hero.vY >= 0) { // prevents hooking on edge
                    hero.landed(r.overlapV.y);
                }
            }
            else if(r.b.type === JQObject.ELEVATOR) {
                if(dir.y === Dir.TOP && hero.vY >= 0) {
                    hero.isOnObj = true;
                    hero.isJumping = false;
                    hero.vY = (r.b.vY > 0) ? r.b.vY : 0;

                    r.a.pos.y -= r.overlapV.y;
                }
            }
            else {
                r.a.pos.x -= r.overlapV.x;

                if(dir.y === Dir.TOP && hero.vY >= 0) {  // prevents hooking on edge
                    hero.landed(r.overlapV.y);
                }
                else if(dir.y === Dir.BOT && hero.vY <= 0) {  // prevents hooking on edge
                    hero.vY = 0;
                    r.a.pos.y -= r.overlapV.y;
                }
            }
        });
        
        if (hero.isHolding) {
            if (hero.vX === 0) {
                hero.curItem.pos.x = hero.pos.x + 7;
                hero.curItem.pos.y = hero.pos.y + 20;
            }
            else {
                hero.curItem.pos.x = hero.pos.x + ((hero.dir === Dir.RIGHT) ? 45 : -32);
                hero.curItem.pos.y = hero.pos.y + 16;
            }
        }

        Physics.testHeroItems(function (r, idx) {
            if (r.b.type === JQObject.CRATE) {      // TODO: make more generic
                if (r.overlapN.y === 1) {           // on top
                    hero.pos.y -= r.overlapV.y;
                    hero.isOnObj = true;
                    hero.isJumping = false;

                    hero.vY = 0;

                    if(typeof (r.b.onObj) !== "undefined" && r.b.onObj !== null) {  // hero on crate on elevator
                        if(r.b.onObj.type === JQObject.ELEVATOR) {
                            hero.vY = r.b.vY;
                        }
                    }
                }
                else if (!hero.isHolding && r.b.grabbable && !r.b.recentlyHeld) {
                    if (r.b.isOnObj === true) {
                        r.b.isOnObj = false;

                        if (r.b.onObj !== null) {
                            r.b.onObj.grabbable = true;
                            r.b.onObj = null;
                        }
                    }

                    r.b.isBeingHeld = true;

                    hero.curItem = r.b;
                    hero.isHolding = true;

                    level.items.splice(idx, 1);
                }
            }
            else {
                audio.itemPickedUp.play();

                if (r.b.type === JQObject.SACK) {
                    hero.ammo += r.b.val;
                }
                else if (r.b.type === JQObject.CASH) {
                    hero.cash += r.b.val;
                }

                level.items.splice(idx, 1);
            }
        });
    }

    return {
        updatePosition: function (){	
            // TODO: buggy at edges, quickly changing direction incorrectly causes an updateView()
            
            if(((hero.dir === Dir.RIGHT && hero.pos.x >= (HALFW + 35)) ||
               (hero.dir === Dir.LEFT && hero.pos.x <= (HALFW - 45))) &&
               (hero.lvlX + hero.vX >= 0) &&
               (hero.lvlX + hero.vX <= level.curLvl.width - FULLW)
            ){
                hero.lvlX += hero.vX;

                // updateProjectileView
                for(var i = 0; i < hero.bulletArr.length; ++i) {
                    hero.bulletArr[i].pos.x -= hero.vX;
                }

                level.updateView();
            }
            else {
                hero.pos.x += hero.vX;
            }

            if (!hero.onLadder) {
                hero.pos.y += hero.vY;
            }
        },

        checkCollision: function () {
            projectileHandler();
            screenCollision();	    // hero and screen
            levelCollision();
        }
    };
};

/// <reference path="../linker.js" />

var KeyCode = Object.freeze({
    ENTER: 13,
    CTRL: 17,
    A: 65,
    D: 68,
    F: 70,
    H: 72,
    J: 74,
    K: 75,
    M: 77,
    O: 79,
    R: 82,
    S: 83,
    W: 87,
    EMPTY: -1,
    SPACEBAR: 32
});

// The input component of hero.
var HeroInputComponent = function () {

    var maxVx = 3,
        maxVy = 10
    ;

    // global key vars
    keysDown = {};
    lastKeyDown = -1;

    $(document).on("click", ".resize", function () {
        if ($(this).hasClass("off")) {
            $(this).removeClass("off").addClass("on");
            $(this).children("span").removeClass("icon-expand").addClass("icon-contract");
        }
        else if ($(this).hasClass("on")) {
            $(this).removeClass("on").addClass("off");
            $(this).children("span").removeClass("icon-contract").addClass("icon-expand");
        }

        utils.toggleFullScreen();
    });

    addEventListener("keydown", function (e) {
        if (e.keyCode === KeyCode.SPACEBAR)
            e.preventDefault(); 			    // scrolling to bottom of page
        else if (e.keyCode === KeyCode.M)	    // mute/unmute
            audio.handleMuteButton();
        else if (e.keyCode === KeyCode.F)        // resize
            $(".resize").trigger("click");
        else if (e.keyCode === KeyCode.K &&		// jump; TODO: move to check() function
               (!hero.isJumping && ((lastKeyDown !== KeyCode.K) || !(keysDown[KeyCode.K]))) &&
               hero.isOnObj
        ) {
            audio.jump.play();
            hero.vY = 0;
            hero.isJumping = true;
            hero.isOnObj = false;
        }
        else if (e.keyCode === KeyCode.J &&		// shoot; TODO: move to check() function
                ((lastKeyDown != KeyCode.J) || !(keysDown[KeyCode.J]))
        ) {
            if (hero.ammo > 0 && !hero.isHolding) {
                audio.play(audio.effort);

                var projectile = new GameObj(JQObject.SHURIKEN, hero.pos.x, hero.pos.y + Shuriken.h/2, Shuriken.w, Shuriken.h);
                projectile.dirR = (hero.dir === Dir.RIGHT);
                projectile.deg = 0;

                hero.bulletArr.push(projectile);

                --hero.ammo;
                hero.idleTime = 0;
            }
        }
        else if (e.keyCode == KeyCode.O) {      // options
            utils.toggleMenu();
        }

        lastKeyDown = e.keyCode;
        keysDown[e.keyCode] = true;
    }, false);

    addEventListener("keyup", function (e) {
        delete keysDown[e.keyCode];
    }, false);


    return {
        check: function () {
            var doGravity = false;

            // jumping
            if (hero.isJumping) {
                if (hero.jumpMod > 0) {
                    hero.vY -= hero.aY * hero.jumpMod--;
                }
                else {
                    doGravity = true;
                }
            }
            else {
                hero.jumpMod = hero.jumpMod0;
                doGravity = true;
            }

            if (doGravity && !hero.onLadder) {
                var fixVy = hero.vY + game.gravity*2;

                if (fixVy > maxVy) {
                    hero.vY = maxVy;
                }
                else {
                    hero.vY = fixVy;
                }
            }


            // --------- keys pressed --------
            var leftOrRight = false;
            // left
            if(keysDown[KeyCode.A]){
                hero.vX = (Math.abs(hero.vX - hero.aX) > maxVx) ? -maxVx : (hero.vX - hero.aX);
                hero.dir = Dir.LEFT;
                leftOrRight = true;
            }

            // right
            if (keysDown[KeyCode.D]) {
                hero.vX = (Math.abs(hero.vX + hero.aX) > maxVx) ? maxVx : (hero.vX + hero.aX);
                hero.dir = Dir.RIGHT;
                leftOrRight = true;
            }
	    
            if(Math.abs(hero.vX) < hero.aX){    
                hero.vX = 0;
            }
            else if(!leftOrRight){
                //hero.vX += (hero.vX > 0) ? -game.friction : game.friction;
                hero.vX /= 1.26;
            }
	    

            // up
            if (keysDown[KeyCode.W]) {
                if (hero.onLadder) {
                    --hero.pos.y;
                }
            }

            // down
            if (keysDown[KeyCode.S]) {
                if (hero.onLadder) {
                    ++hero.pos.y;
                }
            }

	    
            // drop 
            if (keysDown[KeyCode.SPACEBAR]) {
                if (hero.isHolding) {
                    hero.isHolding = false;
                    hero.curItem.isBeingHeld = false;
                    hero.curItem.recentlyHeld = true;       // TODO: fix api
                    level.items.push(hero.curItem);
                    hero.curItem = null;
                }
            }

		
            //----- heal (h)
            if(keysDown[KeyCode.H]){
                if(hero.medKits > 0 && hero.health < hero.maxHealth){
                    ++hero.health;
                    --hero.medKits;

                    audio.play(audio.enchant, true);
                }
            }
		
		
            // restore
            if(keysDown[KeyCode.R] && !(keysDown[KeyCode.CTRL])){
                if(hero.manaKits > 0 && hero.mana < hero.maxMana){
                    ++hero.mana;
                    --hero.manaKits;

                    audio.play(audio.enchant, true);
                }
            }
		
        }
    };
};

/// <reference path="linker.js" />

var Main = (function () {

    function setCanvasGlobals() {
        canvas = $("canvas")[0];
        ctx = canvas.getContext("2d");
        
        FULLW = canvas.width;
        FULLH = canvas.height - game.padHUD;
        HALFW = FULLW / 2;
        HALFH = FULLH / 2;
    }

    function loadingScreen() {
        ctx.fillStyle = "#e1e1e1";
        ctx.font = "25px 'Press Start 2P'";
        ctx.fillText("LOADING...", HALFW - 80, HALFH + 20);
    }

    function debug() {
        // dev enviroment
        if (location.host === "jon") {
            window.DEBUG = true;

            // speed up canvas transition
            $(canvas).css({"transition": "opacity 0.01s"});

            // skip start screen
            lastKeyDown = KeyCode.ENTER;

            // mute audio
            audio.handleMuteButton();
        }
    }


    return {
        init: function () {
            setCanvasGlobals();
            loadingScreen();

            hero.init();
            audio.init();
            level.init();
            HUD.init();

            // wait for google font
            $(document).on("fontLoaded", function () {
                // game timer
                setInterval(function () {
                    ++game.actualTime;
                }, 1000);

                // start the game
                game.start();


                //debug();
            });
        }
    }
})();

$(function () {
    // load font
    window.WebFontConfig = {
        google: {
            families: ['Press Start 2P']
        },
        active: function () {
            $(document).trigger("fontLoaded");
        },
        inactive: function () {
            alert("There was a problem loading a font from google, some text may not render correctly (refreshing the page may fix the issue).");
            $(document).trigger("fontLoaded");
        }
    };

    (function () {
        var wf = document.createElement("script");
        wf.src = "//ajax.googleapis.com/ajax/libs/webfont/1/webfont.js";
        wf.type = "text/javascript";
        wf.async = "true";
        var s = document.getElementsByTagName("script")[0];
        s.parentNode.insertBefore(wf, s);
    })();


    Main.init();
});

//# sourceMappingURL=jonsQuest.js.map