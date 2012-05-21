/**
 * timbre/envelopes
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ADSR = (function() {
    var ADSR = function() {
        initialize.apply(this, arguments);
    }, $this = ADSR.prototype;
    
    Object.defineProperty($this, "a", {
        set: function(value) {
            if (typeof value === "number") {
                this._a = value;
            }
        },
        get: function() {
            return this._a;
        }
    });
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._d = value;
            }
        },
        get: function() {
            return this._d;
        }
    });
    Object.defineProperty($this, "s", {
        set: function(value) {
            if (typeof value === "number") {
                this._s = value;
            }
        },
        get: function() {
            return this._s;
        }
    });
    Object.defineProperty($this, "r", {
        set: function(value) {
            if (typeof value === "number") {
                this._r = value;
            }
        },
        get: function() {
            return this._r;
        }
    });
    
    var initialize = function(_args) {
        var i;

        i = 0;
        if (typeof _args[i] === "number") {
            this.a = _args[i++];
        } else {
            this.a = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.d = _args[i++];
        } else {
            this.d = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.s = _args[i++];
        } else {
            this.s = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.r = _args[i++];
        } else {
            this.r = 0.0;
        }
        if (typeof _args[i] === "number") {
            this.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this.add = _args[i++];
        }
        
        this._mode = 0;
        this._samplesMax = (timbre.samplerate * (this._a / 1000))|0;
        this._samples    = 0;
    };
    
    $this.clone = function() {
        return new ADSR([this.a, this.d, this.s, this.r, this.mul, this.add]);
    };
    
    $this.bang = $this.keyOn = function() {
        this._mode = 0;
        this._samplesMax = (timbre.samplerate * (this._a / 1000))|0;
        this._samples    = 0;
        timbre.fn.do_event(this, "bang");
        timbre.fn.do_event(this, "A");
        return this;
    };
    
    $this.keyOff = function() {
        this._mode = 3;
        this._samples = 0;
        this._samplesMax = (timbre.samplerate * (this._r / 1000))|0;
        timbre.fn.do_event(this, "R");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell;
        var mode, samples, samplesMax;
        var mul, add;
        var s0, s1, x, i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            mode    = this._mode;
            samples = this._samples;
            samplesMax = this._samplesMax;
            mul = this._mul;
            add = this._add;
            s0 = this._s;
            s1 = 1.0 - this._s;
            
            while (samples >= samplesMax) {
                if (mode === 0) { // A -> D
                    this._mode = 1;
                    this._samples   -= samplesMax;
                    this._samplesMax = (timbre.samplerate * (this._d / 1000))|0;
                    timbre.fn.do_event(this, "D");
                    mode = this._mode;
                    samplesMax = this._samplesMax;
                    samples    = this._samples;
                    continue;
                }
                if (mode === 1) { // D -> S
                    if (s0 === 0) {
                        mode = 3;
                        continue;
                    }
                    this._mode = 2;
                    this._samples    = 0;
                    this._samplesMax = Infinity;
                    timbre.fn.do_event(this, "S");
                    mode = this._mode;
                    samplesMax = this._samplesMax;
                    samples    = this._samples;
                    continue;
                }
                if (mode === 3) { // S -> end
                    this._mode = 4;
                    this._samples    = 0;
                    this._samplesMax = Infinity;
                    timbre.fn.do_event(this, "ended");
                    mode = this._mode;
                    samplesMax = this._samplesMax;
                    samples    = this._samples;
                    continue;
                }
            }
            switch (mode) {
            case 0:
                x = samples / samplesMax;
                break;
            case 1:
                x = samples / samplesMax;
                x = (1.0 - x) * s1 + s0;
                break;
            case 2:
                x = s0;
                break;
            case 3:
                x = samples / samplesMax;
                x = (1.0 - x) * s0;
                break;
            default:
                x = 0;
                break;
            }
            x = x * mul + add;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            this._mode = mode;
            this._samples    = samples + imax;
            this._samplesMax = samplesMax;
        }
        return cell;
    };
    
    return ADSR;
}());
timbre.fn.register("adsr", ADSR);


var Tween = (function() {
    var Tween = function() {
        initialize.apply(this, arguments);
    }, $this = Tween.prototype;
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var f;
            if (typeof value === "string") {
                if ((f = Tween.functions[value]) !== undefined) {
                    this._type = value;
                    this._func = f;
                }
            }
        },
        get: function() {
            return this._type;
        }
    });
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._d = value;
            }
        },
        get: function() {
            return this._d;
        }
    });
    Object.defineProperty($this, "start", {
        set: function(value) {
            if (typeof value === "number") {
                this._start = value;
            }
        },
        get: function() {
            return this._start;
        }
    });
    Object.defineProperty($this, "stop", {
        set: function(value) {
            if (typeof value === "number") {
                this._stop = value;
            }
        },
        get: function() {
            return this._stop;
        }
    });
    
    var initialize = function(_args) {
        var i, type;
        
        i = 0;
        if (typeof _args[i] === "string" && (Tween.functions[_args[i]]) !== undefined) {
            type = _args[i++];
        } else {
            type = "linear";
        }
        if (typeof _args[i] === "number") {
            this.d = _args[i++];
        } else {
            this.d = 1000;
        }
        if (typeof _args[i] === "number") {
            this.start = _args[i++];
        } else {
            this.start = 0;
        }
        if (typeof _args[i] === "number") {
            this.stop = _args[i++];
        } else {
            this.stop = 1;
        }
        if (typeof _args[i] === "number") {
            this.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this.add = _args[i++];
        }
        
        this._phase     = 0;
        this._phaseStep = 0;
        this._value     = 0;
        this._enabled   = false;
        this.type = type;        
    };

    $this.clone = function() {
        return new Tween([this.type, this.d, this.start, this.stop, this.mul, this.add]);
    };
    
    $this.bang = function() {
        var diff;
        diff = this._stop - this._start;
        this._phase     = 0;
        this._phaseStep = timbre.cellsize / (this._d / 1000 * timbre.samplerate);
        this._value     = this._func(0) * diff + this._start;
        this._enabled   = true;
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell;
        var value, diff, changed, ended;
        var i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            if (this._enabled) {
                this._phase += this._phaseStep;
                if (this._phase >= 1.0) {
                    this._phase = 1.0;
                    this._enabled = false;
                    ended = true;
                } else {
                    ended = false;
                }
                diff = this._stop - this._start;
                this._value = this._func(this._phase) * diff + this._start;
                changed = true;
            } else {
                changed = false;
            }
            value = this._value * this._mul + this._add;
            for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                cell[i] = value;
            }
            if (changed && this.onchanged) this.onchanged(this._value);
            if (ended) timbre.fn.do_event(this, "ended");
        }
        return cell;
    };
    
    return Tween;
}());
timbre.fn.register("tween", Tween);

Tween.functions = {
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
		return 1 - Tween.functions["bounce.out"]( 1 - k );
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
		if ( k < 0.5 ) return Tween.functions["bounce.in"]( k * 2 ) * 0.5;
		return Tween.functions["bounce.out"]( k * 2 - 1 ) * 0.5 + 0.5;
    },
};



var Perc = (function() {
    var Perc = function() {
        initialize.apply(this, arguments);
    }, $this = Perc.prototype;
    
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._d = value;
            }
        },
        get: function() {
            return this._d;
        }
    });
    
    var initialize = function(_args) {
        var i;
        
        i = 0;
        if (typeof _args[i] === "number") {
            this.d = _args[i++];
        } else {
            this.d = 100.0;
        }
        if (typeof _args[i] === "number") {
            this.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this.add = _args[i++];
        }
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        this._samples = 0;
        this._dx = timbre.cellsize / this._samples;
        this._x  = 0;
    };

    $this.clone = function() {
        return new Perc([this.d, this.mul, this.add]);
    };
    
    $this.bang = function() {
        this._samples = (timbre.samplerate * (this._d / 1000))|0;
        this._dx = timbre.cellsize / this._samples;
        this._x  = 1.0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell, val;
        var x, dx, samples;
        var i, imax;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            x  = this._x;
            dx = this._dx;
            samples = this._samples;
            val = x * this._mul + this._add;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = val;
            }
            x -= dx;
            if (x < 0.0) x = 0.0;
            if (samples > 0) {
                samples -= imax;
                if (samples <= 0) {
                    this._samples = 0;
                    timbre.fn.do_event(this, "ended");
                    x  = this._x;
                    samples = this._samples;
                }
            }
            
            this._x = x;
            this._samples = samples;
        }
        return cell;
    };
    
    return Perc;
}());
timbre.fn.register("perc", Perc);

// __END__

describe("adsr", function() {
    var instance = timbre("adsr", 1000, 1000, 0.2, 200);
    object_test(ADSR, instance);
});
describe("perc", function() {
    var instance = timbre("perc", 1000);
    object_test(Perc, instance);
});
