
/**
 * @constructor
 */
function Projection(projectionOrigin) {
	this._xOrigin = 0;
	this._yOrigin = 0;
	if(projectionOrigin) {
		this._xOrigin = projectionOrigin.x();
		this._yOrigin = projectionOrigin.y();
	}
}

Projection.prototype.xOrigin = function projectionXOrigin() {
	return this._xOrigin;
}

Projection.prototype.yOrigin = function projectionYOrigin() {
	return this._yOrigin;
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends Projection
 */
function MercatorProjection(projectionOrigin) {
	Projection.call(this, projectionOrigin);
}

MercatorProjection.isKindOf(Projection);

MercatorProjection.prototype.project = function mercatorProjectionProject(latlon) {
	var x = latlon.lon() - this.xOrigin();
	var lat = latlon.lat();
	var y = Math.log(Math.abs(1 / Math.cos(lat) + Math.tan(lat))) - this.yOrigin();
	return new Point(x, y);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends Projection
 */
function SimpleProjection(projectionOrigin) {
	Projection.call(this, projectionOrigin);
}

SimpleProjection.isKindOf(Projection);

SimpleProjection.prototype.project = function simpleProjectionProject(latLon) {
	var x = latLon.lon() - this.xOrigin();
	var y = latLon.lat() - this.yOrigin();
	return new Point(x, y);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function LatLon(lat, lon) {
	this._lat = lat;
	this._lon = lon;
}

LatLon.prototype.lat = function latLonLat() {
	return this._lat;
}

LatLon.prototype.lon = function latLonLon() {
	return this._lon;
}

LatLon.prototype.project = function latLonProject(projection) {
	return projection.project(this);
}

LatLon.prototype.to = function latLonTo(latLon) {
	return this.asPoint().to(latLon.asPoint());
}

LatLon.prototype.asPoint = function latLonAsPoint() {
	var projection = new SimpleProjection(0,0);
	return this.project(projection);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function Point(x, y) {
	this._x = x;
	this._y = y;
}

Point.prototype.x = function pointX() {
	return this._x;
}

Point.prototype.y = function pointY() {
	return this._y;
}

Point.prototype.to = function pointTo(point) {
	return new Segment(this, point);
}

Point.prototype.project = function pointProject() {
	return this;
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function Line(p1, p2) {
	this._x1 = p1.x();
	this._y1 = p1.y();
	this._x2 = p2.x();
	this._y2 = p2.y();
}

Line.prototype.x1 = function lineX1() {
	return this._x1;
}

Line.prototype.x2 = function lineX2() {
	return this._x2;
}

Line.prototype.y1 = function lineY1() {
	return this._y1;
}

Line.prototype.y2 = function lineY2() {
	return this._y2;
}

Line.prototype.includes = function lineIncludes(point) {
	return (point.x() - this.x1()) * (this.y2() - this.y1()) - (point.y() - this.y1()) * (this.x2() - this.x1()) == 0
}

Line.prototype.intercepts = function lineIntercepts(line, doWithInterceptionPoint) {
	var x1 = this.x1();
	var y1 = this.y1();
	var x2 = this.x2();
	var y2 = this.y2();
	var x3 = line.x1();
	var y3 = line.y1();
	var x4 = line.x2();
	var y4 = line.y2();
	var x1y2_y1x2 = x1*y2-y1*x2;
	var y3_y4 = y3-y4;
	var x3_x4 = x3-x4;
	var x1_x2 = x1-x2;
	var y1_y2 = y1-y2;
	var x3y4_y3x4 = x3*y4-y3*x4;
	var z = x1_x2*y3_y4-(y1-y2)*x3_x4;
	var x = (x1y2_y1x2*x3_x4-x1_x2*x3y4_y3x4)/z;
	var y = (x1y2_y1x2*y3_y4-y1_y2*x3y4_y3x4)/z;	
	if(x && y) {
		var point = new Point(x,y);
		if(typeof doWithInterceptionPoint === 'function') {
			return doWithInterceptionPoint(point);
		}
		return true;
	}
	return false;
}

//////////////////////////////////////////////////////////////////////////////////////

/*
 * @constructor
 */
function Segment(p1, p2) {
	Line.call(this, p1, p2);
	this._p1 = p1;
	this._p2 = p2;
}

Segment.isKindOf(Line);

Segment.prototype.p1 = function segmentP1() {
	return this._p1;
}

Segment.prototype.p2 = function segmentP2() {
	return this._p2;
}

Segment.prototype.includes = function segmentIncludes(point) {
	if(Line.prototype.includes.call(this, point)) {
		var includes = point.x().isBetween(this.p1().x(), this.p2().x()) && point.y().isBetween(this.p1().y(), this.p2().y());
		return includes;
	}
	return false;
}

Segment.prototype.intercepts = function segmentIntercepts(segment,doWithInterceptionPoint) {
	return Line.prototype.intercepts.call(this, segment, function checkBounds(point) {
		if(this.includes(point)) {
			if(typeof doWithInterceptionPoint === 'function') {
				return doWithInterceptionPoint(point);
			}
			return true;
		}
		return false;
	}.bind(this));
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function Bounds(upperLeftLatLon, lowerRightLatLon) {
	this._top = upperLeftLatLon.lat();
	this._left = upperLeftLatLon.lon();
	this._right = lowerRightLatLon.lon();
	this._bottom = lowerRightLatLon.lat();
}

Bounds.prototype.sproutFirst = function boundsSproutFirst() {
	return new Bounds(this.upperLeft(), this.center());
}

Bounds.prototype.sproutSecond = function boundsSproutSecond() {
	return new Bounds(this.upperCenter(), this.centerRight());
}

Bounds.prototype.sproutThird = function boundsSproutThird() {
	return new Bounds(this.center(), this.lowerRight());
}

Bounds.prototype.sproutFourth = function boundsSproutFourth() {
	return new Bounds(this.centerLeft(), this.lowerCenter());
}

Bounds.prototype.upperLeft = function boundsUpperLeft() {
	return new LatLon(this.top(), this.left());
}

Bounds.prototype.upperRight = function boundsUpperRight() {
	return new LatLon(this.top(), this.right());
}

Bounds.prototype.upperCenter = function boundsUpperCenter() {
	return new LatLon(this.top(), this.halfLon());
}

Bounds.prototype.centerLeft = function boundsCenterLeft() {
	return new LatLon(this.halfLat(), this.left());
}

Bounds.prototype.center = function boundsCenter() {
	return new LatLon(this.halfLat(), this.halfLon());
}

Bounds.prototype.centerRight = function boundsCenterRight() {
	return new LatLon(this.halfLat(), this.right());
}

Bounds.prototype.lowerLeft = function boundsLowerLeft() {
	return new LatLon(this.bottom(), this.left());
}

Bounds.prototype.lowerRight = function boundsLowerRight() {
	return new LatLon(this.bottom(), this.right());
}

Bounds.prototype.lowerCenter = function boundsLowerCenter() {
	return new LatLon(this.bottom(), this.halfLon());
}

Bounds.prototype.left = function boundsLeft() {
	return this._left;
}

Bounds.prototype.right = function boundsRight() {
	return this._right;
}

Bounds.prototype.top = function boundsTop() {
	return this._top;
}

Bounds.prototype.bottom = function boundsBottom() {
	return this._bottom;
}

Bounds.prototype.halfLat = function boundsHalfLat() {
	return (this.top() + this.bottom()) / 2;
}

Bounds.prototype.halfLon = function boundsHalfLon() {
	return (this.right() + this.left()) / 2;
}

Bounds.prototype.intersects = function boundsIntersects(bounds) {
	var mySides = this.sides();
	var sides = bounds.sides();
	var line = this.center().to(bounds.center());
	var crossLine = line.intercepts.bind(line);
	var my = mySides.filter(crossLine).pop();
	var theirs = sides.filter(crossLine).pop();
	
	if(my) {
		return my.intercepts(line, function checkCenter(point) {
			var intercepts = this.center().asPoint().to(point).includes(bounds.center().asPoint());
			return intercepts;
		}.bind(this));
	}
	return true;
}

Bounds.prototype.sides = function boundsSides() {
	return [
		new Segment(this.left().at(this.top()), this.right().at(this.top())),
		new Segment(this.left().at(this.bottom()), this.right().at(this.bottom())),
		new Segment(this.left().at(this.top()), this.left().at(this.bottom())),
		new Segment(this.right().at(this.top()), this.right().at(this.bottom()))
	];
}

Bounds.prototype.toString = function boundsToString() {
	return [this.left(), this.bottom(), this.right(), this.top()].join(',');
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 */
function MapSection(zoomLevel, bounds) {
	this._zoomLevel = zoomLevel;
	this._bounds = bounds;
}

MapSection.prototype.zoomLevel = function mapSectionZoomLevel() {
	return this._zoomLevel;
}

MapSection.prototype.bounds = function mapSectionBounds() {
	return this._bounds;
}

MapSection.prototype.nextLevel = function mapSectionNextLevel(bounds) {
	return new MapSection(this.zoomLevel() + 1, bounds);
}

MapSection.prototype.sproutFirst = function mapSectionSproutFirst() {
	return this.nextLevel(this.bounds().sproutFirst());
}

MapSection.prototype.sproutSecond = function mapSectionSproutSecond() {
	return this.nextLevel(this.bounds().sproutSecond());
}

MapSection.prototype.sproutThird = function mapSectionSproutThird() {
	return this.nextLevel(this.bounds().sproutThird());
}

MapSection.prototype.sproutFourth = function mapSectionSproutFourth() {
	return this.nextLevel(this.bounds().sproutFourth());
}

MapSection.prototype.sproutFirstIfMatches = function mapSectionSproutFirstIfMatches(condition) {
	var sprout = this.sproutFirst();
	if(condition(sprout)) {
		return sprout;
	}
	return null;
}

MapSection.prototype.sproutSecondIfMatches = function mapSectionSproutSecondIfMatches(condition) {
	var sprout = this.sproutSecond();
	if(condition(sprout)) {
		return sprout;
	}
	return null;
}

MapSection.prototype.sproutThirdIfMatches = function mapSectionSproutThirdIfMatches(condition) {
	var sprout = this.sproutThird();
	if(condition(sprout)) {
		return sprout;
	}
	return null;
}

MapSection.prototype.sproutFourthIfMatches = function mapSectionSproutFourthIfMatches(condition) {
	var sprout = this.sproutFourth();
	if(condition(sprout)) {
		return sprout;
	}
	return null;
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends MapSection
 */
function MapSectionZoom1(bounds) {
	MapSection.call(this, 1, bounds);
}

MapSectionZoom1.isKindOf(MapSection);

MapSectionZoom1.prototype.nextLevel = function mapSectionZoom1NextLevel(bounds) {
	return new MapSectionZoom2(bounds);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends MapSection
 */
function MapSectionZoom2(bounds) {
	MapSection.call(this, 2, bounds);
}

MapSectionZoom2.isKindOf(MapSection);

MapSectionZoom2.prototype.nextLevel = function mapSectionZoom2NextLevel(bounds) {
	return new MapSectionZoom3(bounds);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends MapSection
 */
function MapSectionZoom3(bounds) {
	MapSection.call(this, 3, bounds);
}

MapSectionZoom3.isKindOf(MapSection);

MapSectionZoom3.prototype.nextLevel = function mapSectionZoom3NextLevel(bounds) {
	return new MapSectionZoom4(bounds);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends MapSection
 */
function MapSectionZoom4(bounds) {
	MapSection.call(this, 4, bounds);
}

MapSectionZoom4.isKindOf(MapSection);

MapSectionZoom4.prototype.nextLevel = function mapSectionZoom4NextLevel(bounds) {
	return new MapSectionZoom5(bounds);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends MapSection
 */
function MapSectionZoom5(bounds) {
	MapSection.call(this, 5, bounds);
}

MapSectionZoom5.isKindOf(MapSection);

MapSectionZoom5.prototype.nextLevel = function mapSectionZoom5NextLevel(bounds) {
	return new MapSectionZoom6(bounds);
}

//////////////////////////////////////////////////////////////////////////////////////

/**
 * @constructor
 * @extends MapSection
 */
function MapSectionZoom6(bounds) {
	MapSection.call(this, 6, bounds);
}

MapSectionZoom6.isKindOf(MapSection);

MapSectionZoom6.prototype.nextLevel = function mapSectionZoom6NextLevel(bounds) {
	return null;
}

MapSectionZoom6.prototype.sproutFirst = function mapSectionZoom6SproutFirst() {
	return null;
}

MapSectionZoom6.prototype.sproutSecond = function mapSectionZoom6SproutSecond() {
	return null;
}

MapSectionZoom6.prototype.sproutThird = function mapSectionZoom6SproutThird() {
	return null;
}

MapSectionZoom6.prototype.sproutFourth = function mapSectionZoom6SproutFourth() {
	return null;
}

MapSectionZoom6.prototype.sproutFirstIfMatches = function mapSectionZoom6SproutFirstIfMatches(condition) {
	return null;
}

MapSectionZoom6.prototype.sproutSecondIfMatches = function mapSectionZoom6SproutSecondIfMatches(condition) {
	return null;
}

MapSectionZoom6.prototype.sproutThirdIfMatches = function mapSectionZoom6SproutThirdIfMatches(condition) {
	return null;
}

MapSectionZoom6.prototype.sproutFourthIfMatches = function mapSectionZoom6SproutFourthIfMatches(condition) {
	return null;
}

