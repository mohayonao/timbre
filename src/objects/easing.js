/**
 * Easing
 * 'Easing.Functions' refered to https://github.com/sole/tween.js
 * v 0. 1. 0: first version
 * v12.07.18: add ar-mode
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Easing = (function() {
    var Easing = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Easing, {
        base: "kr-ar",
        properties: {
            type: {
                set: function(val) {
                    var f;
                    if (typeof val === "string") {
                        if ((f = Easing.Functions[val]) !== undefined) {
                            this._.type = val;
                            this._.func = f;
                        }
                    } else if (typeof val === "function") {
                        this._.type = "function";
                        this._.func = val;
                    }
                },
                get: function() { return this._.type; }
            },
            delay: {
                set: function(val) {
                    if (typeof val === "number") this._.delay = val;
                },
                get: function() { return this._.delay; }
            },
            duration: {
                set: function(val) {
                    if (typeof val === "number") this._.duration = val;
                },
                get: function() { return this._.duration; }
            },
            currentTime: {
                get: function() { return this._.currentTime; }
            },
            start: {
                set: function(val) {
                    if (typeof val === "number") this._.start = val;
                },
                get: function() { return this._.start; }
            },
            stop: {
                set: function(val) {
                    if (typeof val === "number") this._.stop = val;
                },
                get: function() { return this._.stop; }
            },
            value: {
                get: function() { return this._.value; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            (Easing.Functions[_args[i]]) !== undefined) {
            this.type = _args[i++];
        } else if (typeof _args[i] === "function") {
            this.type = _args[i++];
        } else {
            this.type = "linear";
        }
        _.duration = (typeof _args[i] === "number") ? _args[i++] : 1000;
        _.start    = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.stop     = (typeof _args[i] === "number") ? _args[i++] : 1;
        
        if (typeof _args[i] === "function") {
            this.onchanged = _args[i++];
        }
        
        _.delay = 0;
        
        _.status  = -1;
        _.value   =  0;
        _.samples = Infinity;
        _.x0 = 0;
        _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("ease");
        newone._.type = _.type;
        newone._.func = _.func;
        newone._.duration = _.duration;
        newone._.value = _.value;
        newone._.start = _.start;
        newone._.stop  = _.stop;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;
        
        _.status = 0;
        _.value  = 0;
        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
        _.x0 = 0; _.dx = 0;
        _.currentTime = 0;
        
        timbre.fn.doEvent(this, "bang");
        return this;
    };

    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x0, x1, dx, value, i, imax;
        var mul, add;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            while (_.samples <= 0) {
                if (_.status === 0) {
                    _.status = 1;
                    _.samples = (timbre.samplerate * (_.duration / 1000))|0;
                    _.x0 = 0;
                    _.dx = timbre.cellsize / _.samples;
                    continue;
                }
                if (_.status === 1) {
                    _.status = 2;
                    _.samples = Infinity;
                    _.x0 = 1;
                    _.dx = 0;
                    x0 = _.func(1);
                    _.value = (x0 * (_.stop-_.start) + _.start) * _.mul + _.add;
                    timbre.fn.doEvent(this, "ended");
                    continue;
                }
            }
            if (_.status !== 2) {
                x0 = (_.status === 1) ? _.func(_.x0) : 0;
                
                value = x0 * (_.stop - _.start) + _.start;
                
                if (_.ar) { // ar-mode
                    
                    mul = _.mul;
                    add = _.add;
                    
                    x0 = _.value;
                    x1 =   value;
                    dx = (x1 - x0) / cell.length;
                    
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = x0 * mul + add;
                        x0 += dx;
                    }
                } else {    // kr-mode
                    x0 = value * _.mul + _.add;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = x0;
                    }
                }
                
                if (_.status === 1) {
                    timbre.fn.doEvent(this, "changed", [value]);
                }
                _.value = value;
                _.x0 += _.dx;
                _.samples -= imax;
            } else {
                value = _.value;
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    cell[i] = value;
                }
            }
            _.currentTime += imax * 1000 / timbre.samplerate;
        }
        return cell;
    };
    
    $this.getFunction = function(name) {
        return Easing.Functions[name];
    };
    
    $this.setFunction = function(name, func) {
        if (typeof func === "function") {
            Easing.Functions[name] = func;
        }
    };
    
    return Easing;
}());
timbre.fn.register("ease", Easing);

Easing.Functions = {
    "linear": function(k) {
        return k;
    },
    "quadratic.in": function(k) {
        return k * k;
    },
    "quadratic.out": function(k) {
        return k * ( 2 - k );
    },
    "quadratic.inout": function(k) {
		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k;
		return - 0.5 * ( --k * ( k - 2 ) - 1 );
    },
    "cubic.in": function(k) {
		return k * k * k;
    },
    "cubic.out": function(k) {
        return --k * k * k + 1;
    },
    "cubic.inout": function(k) {
		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k;
		return 0.5 * ( ( k -= 2 ) * k * k + 2 );
    },
    "quartic.in": function(k) {
        return k * k * k * k;
    },
    "quartic.out": function(k) {
		return 1 - --k * k * k * k;
    },
    "quartic.inout": function(k) {
		if ( ( k *= 2 ) < 1) return 0.5 * k * k * k * k;
		return - 0.5 * ( ( k -= 2 ) * k * k * k - 2 );
    },
    "quintic.in": function(k) {
        return k * k * k * k * k;
    },
    "quintic.out": function(k) {
		return --k * k * k * k * k + 1;
    },
    "quintic.inout": function(k) {
		if ( ( k *= 2 ) < 1 ) return 0.5 * k * k * k * k * k;
		return 0.5 * ( ( k -= 2 ) * k * k * k * k + 2 );
    },
    "sinusoidal.in": function(k) {
        return 1 - Math.cos( k * Math.PI / 2 );
    },
    "sinusoidal.out": function(k) {
        return Math.sin( k * Math.PI / 2 );
    },
    "sinusoidal.inout": function(k) {
        return 0.5 * ( 1 - Math.cos( Math.PI * k ) );
    },
    "exponential.in": function(k) {
		return k === 0 ? 0 : Math.pow( 1024, k - 1 );
    },
    "exponential.out": function(k) {
		return k === 1 ? 1 : 1 - Math.pow( 2, - 10 * k );
    },
    "exponential.inout": function(k) {
		if ( k === 0 ) return 0;
		if ( k === 1 ) return 1;
		if ( ( k *= 2 ) < 1 ) return 0.5 * Math.pow( 1024, k - 1 );
		return 0.5 * ( - Math.pow( 2, - 10 * ( k - 1 ) ) + 2 );
    },
    "circular.in": function(k) {
		return 1 - Math.sqrt( 1 - k * k );
    },
    "circular.out": function(k) {
		return Math.sqrt( 1 - --k * k );
    },
    "circular.inout": function(k) {
		if ( ( k *= 2 ) < 1) return - 0.5 * ( Math.sqrt( 1 - k * k) - 1);
		return 0.5 * ( Math.sqrt( 1 - ( k -= 2) * k) + 1);
    },
    "elastic.in": function(k) {
		var s, a = 0.1, p = 0.4;
		if ( k === 0 ) return 0;
		if ( k === 1 ) return 1;
		if ( !a || a < 1 ) { a = 1; s = p / 4; }
		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
		return - ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
    },
    "elastic.out": function(k) {
		var s, a = 0.1, p = 0.4;
		if ( k === 0 ) return 0;
		if ( k === 1 ) return 1;
		if ( !a || a < 1 ) { a = 1; s = p / 4; }
		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
		return ( a * Math.pow( 2, - 10 * k) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) + 1 );
    },
    "elastic.inout": function(k) {
		var s, a = 0.1, p = 0.4;
		if ( k === 0 ) return 0;
		if ( k === 1 ) return 1;
		if ( !a || a < 1 ) { a = 1; s = p / 4; }
		else s = p * Math.asin( 1 / a ) / ( 2 * Math.PI );
		if ( ( k *= 2 ) < 1 ) return - 0.5 * ( a * Math.pow( 2, 10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) );
		return a * Math.pow( 2, -10 * ( k -= 1 ) ) * Math.sin( ( k - s ) * ( 2 * Math.PI ) / p ) * 0.5 + 1;
    },
    "back.in": function(k) {
		var s = 1.70158;
		return k * k * ( ( s + 1 ) * k - s );
    },
    "back.out": function(k) {
		var s = 1.70158;
		return --k * k * ( ( s + 1 ) * k + s ) + 1;
    },
    "back.inout": function(k) {
		var s = 1.70158 * 1.525;
		if ( ( k *= 2 ) < 1 ) return 0.5 * ( k * k * ( ( s + 1 ) * k - s ) );
		return 0.5 * ( ( k -= 2 ) * k * ( ( s + 1 ) * k + s ) + 2 );
    },
    "bounce.in": function(k) {
		return 1 - Easing.Functions["bounce.out"]( 1 - k );
    },
    "bounce.out": function(k) {
		if ( k < ( 1 / 2.75 ) ) {
			return 7.5625 * k * k;
		} else if ( k < ( 2 / 2.75 ) ) {
			return 7.5625 * ( k -= ( 1.5 / 2.75 ) ) * k + 0.75;
		} else if ( k < ( 2.5 / 2.75 ) ) {
			return 7.5625 * ( k -= ( 2.25 / 2.75 ) ) * k + 0.9375;
		} else {
			return 7.5625 * ( k -= ( 2.625 / 2.75 ) ) * k + 0.984375;
		}
    },
    "bounce.inout": function(k) {
		if ( k < 0.5 ) return Easing.Functions["bounce.in"]( k * 2 ) * 0.5;
		return Easing.Functions["bounce.out"]( k * 2 - 1 ) * 0.5 + 0.5;
    },
};

// __END__
if (module.parent && !module.parent.parent) {
    describe("ease", function() {
        object_test(Easing, "ease");
    });
}
