
/**
 * @constructor
 */
function Quadtree(node) {
	this._node = node;
}

Quadtree.prototype.first = function quadtreeFirst() { return this._sprout('_first', 'First'); };
Quadtree.prototype.second = function quadtreeSecond() { return this._sprout('_second', 'Second'); };
Quadtree.prototype.third = function quadtreeThird() { return this._sprout('_third', 'Third'); };
Quadtree.prototype.fourth = function quadtreeFourth() { return this._sprout('_fourth', 'Fourth'); };

Quadtree.prototype._sprout = function quadtree_sprout(local, suffix) {
	if(this[local]) {
		return this[local];
	}
	this[local] = new Quadtree(this.node()['sprout' + suffix]());
	return this[local];
}

Quadtree.prototype.node = function quadtreeNode() {
	return this._node;
}

Quadtree.prototype.sprouts = function quadtreeSprouts() {
	var sprouts = [];
	if(this._first) sprouts.push(this._first);
	if(this._second) sprouts.push(this._second);
	if(this._third) sprouts.push(this._third);
	if(this._fourth) sprouts.push(this._fourth);
	return sprouts;
}

Quadtree.prototype.match = function quadtreeMatch(condition) {
	var matches = [];
	[['first','First'],['second','Second'],['third','Third'],['fourth','Fourth']].forEach(function quadtreeMatchHelper(n) {
		var local = n[0];
		var term = n[1];
		if(this['_' + local]) {
			if(condition(this[local]().node())) {
				matches.push(this[local]());
			}
		} else {
			var sprout = this.node()['sprout' + term + 'IfMatches'](condition);
			if(sprout) {
				this['_' + local] = new Quadtree(sprout);
				matches.push(this[local]());
			}
		}
	}.bind(this));
	return matches;
}

Quadtree.prototype.cursor = function quadtreeCursor() {
	return new QCursor(this);
}

/**
 * @constructor
 */
function QCursor(quadtree) {
	this._backtracking = [];
	this._current = quadtree;
}

QCursor.prototype._navigate = function qcursor_navigate(local, andDo) {
	this._record(this.current()[local]());
	if(andDo) {
		andDo(this.node());
	}
	return this;
}

QCursor.prototype._record = function qcursor_record(newOne) {
	this._backtracking.push(this.current());
	this._current = newOne;
}

QCursor.prototype.node = function qcursorNode() {
	return this.current().node();
}

QCursor.prototype.current = function qcursorCurrent() {
	return this._current;
}

QCursor.prototype.first = function(andDo) { return this._navigate('first', andDo); };
QCursor.prototype.second = function(andDo) { return this._navigate('second', andDo); };
QCursor.prototype.third = function(andDo) { return this._navigate('third', andDo); };
QCursor.prototype.fourth = function(andDo) { return this._navigate('fourth', andDo); };

QCursor.prototype.back = function qcursorBack(andDo) {
	this._current = this._backtracking.pop();
	if(andDo) {
		andDo(this.node());
	}
	return this;
}

QCursor.prototype.detect = function qcursorDetect(condition, andDo, ifNone) {
	var matches = this.current().sprouts().filter(function (t) { return condition(t.node()); });
	if(matches.length > 0) {
		this._record(matches[0]);
		if(andDo) {
			andDo(this.node());
		}
	} else if(ifNone) {
		ifNone();
	}
	return this;
}

QCursor.prototype.climb = function qcursorClimb(condition, until, andDo) {
	var todo = [this.current()];
	var ends = [];
	while(todo.length > 0) {
		var tree = todo.shift();
		var matches = tree.match(condition);
		matches.forEach(function qcursorClimbFind(tree) {
			if(until(tree.node())) {
				ends.push(tree);
			} else {
				todo.push(tree);
			}
		});
	}
	ends.forEach(function qcursorClimbDoEach(tree) { andDo(tree.node()); });
	this._record(new QBranches(ends));
	return this;
}

/**
 * @constructor
 * @extends Quadtree
 */
function QBranches(branches) {
	this._branches = branches;
}

QBranches.isKindOf(Quadtree);

QBranches.prototype.first = function qbranchesFirst() {
	return new QBranches(this._branches.map(function qbranchesFirstMap(tree) { return tree.first(); }));
}

QBranches.prototype.second = function qbranchesSecond() {
	return new QBranches(this._branches.map(function qbranchesSecondMap(tree) { return tree.second(); }));
}

QBranches.prototype.third = function qbranchesThird() {
	return new QBranches(this._branches.map(function qbranchesThirdMap(tree) { return tree.third(); }));
}

QBranches.prototype.fourth = function qbranchesFourth() {
	return new QBranches(this._branches.map(function qbranchesFourthMap(tree) { return tree.fourth(); }));
}

QBranches.prototype.node = function qbranchesNode() {
	return this._branches.map(function qbranchesNodeMap(tree) { return tree.node(); });
}


//////////////////////////////////////////////////////////////////////////////////////
