
Object.prototype.toArray = function toArray() {
	var array = [];
	for(var i = 0; i < this.length; i++) {
		array.push(this[i]);
	}
	return array;
}

Object.prototype.clone = function clone() {
	/**
 	 * @constructor
 	 */
	function F() {}
	F.prototype = this;
	return new F();
}

Number.prototype.at = function at(a) {
	return new Point(this, a);
}

Number.prototype.isBetween = function isBetween(a, b) {
	if(a <= this) {
		return this <= b;
	}
	return this >= b;
}

Function.prototype.isKindOf = function isKindOf(fn) {
	/**
 	 * @constructor
 	 */
	function F() {}
	F.prototype = fn.prototype;
	this.prototype = new F();
	this.prototype.constructor = this;
	return this;
}

Function.prototype.bind = function bind(self) {
	var callable = this;
	return function binding() { return callable.apply(self, arguments.toArray()); };
}


//////////////////////////////////////////////////////////////////////////////////////