/**
 * timbre/envelopes
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var ADSREnvelope = (function() {
    var ADSREnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = ADSREnvelope.prototype;
    
    Object.defineProperty($this, "a", {
        set: function(value) {
            if (typeof value === "number") {
                this._.a = value;
            }
        },
        get: function() { return this._.a; }
    });
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._.d = value;
            }
        },
        get: function() { return this._.d; }
    });
    Object.defineProperty($this, "s", {
        set: function(value) {
            if (typeof value === "number") {
                this._.s = value;
            }
        },
        get: function() { return this._.s; }
    });
    Object.defineProperty($this, "r", {
        set: function(value) {
            if (typeof value === "number") {
                this._.r = value;
            }
        },
        get: function() { return this._.r; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        _ = this._ = {};
        
        i = 0;
        if (typeof _args[i] === "number") {
            _.a = _args[i++];
        } else {
            _.a = 0.0;
        }
        if (typeof _args[i] === "number") {
            _.d = _args[i++];
        } else {
            _.d = 0.0;
        }
        if (typeof _args[i] === "number") {
            _.s = _args[i++];
        } else {
            _.s = 0.0;
        }
        if (typeof _args[i] === "number") {
            _.r = _args[i++];
        } else {
            _.r = 0.0;
        }
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        
        _.mode = 0;
        _.samplesMax = (timbre.samplerate * (_.a / 1000))|0;
        _.samples    = 0;
    };
    timbre.fn.set_kr_only($this);
    
    $this.clone = function() {
        return new ADSREnvelope([this.a, this.d, this.s, this.r, this.mul, this.add]);
    };

    $this.on = function() {
        var _ = this._;
        _.ison = true;
        _.mode = 0;
        _.samplesMax = (timbre.samplerate * (_.a / 1000))|0;
        _.samples    = 0;
        timbre.fn.do_event(this, "on");
        timbre.fn.do_event(this, "A");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        _.ison = true;
        _.mode = 0;
        _.samplesMax = (timbre.samplerate * (_.a / 1000))|0;
        _.samples    = 0;
        timbre.fn.do_event(this, "bang");
        timbre.fn.do_event(this, "A");
        return this;
    };
    
    $this.off = function() {
        var _ = this._;
        _.mode = 3;
        _.samples = 0;
        _.samplesMax = (timbre.samplerate * (_.r / 1000))|0;
        timbre.fn.do_event(this, "R");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var mode, samples, samplesMax;
        var mul, add;
        var s0, s1, x, i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            mode    = _.mode;
            samples = _.samples;
            samplesMax = _.samplesMax;
            mul = _.mul;
            add = _.add;
            s0 = _.s;
            s1 = 1.0 - s0;
            
            while (samples >= samplesMax) {
                if (mode === 0) { // A -> D
                    _.mode = 1;
                    _.samples   -= samplesMax;
                    _.samplesMax = (timbre.samplerate * (_.d / 1000))|0;
                    timbre.fn.do_event(this, "D");
                    mode = _.mode;
                    samplesMax = _.samplesMax;
                    samples    = _.samples;
                    continue;
                }
                if (mode === 1) { // D -> S
                    if (s0 === 0) {
                        mode = 3;
                        continue;
                    }
                    _.mode = 2;
                    _.samples    = 0;
                    _.samplesMax = Infinity;
                    timbre.fn.do_event(this, "S");
                    mode = _.mode;
                    samplesMax = _.samplesMax;
                    samples    = _.samples;
                    continue;
                }
                if (mode === 3) { // S -> end
                    _.mode = 4;
                    _.samples    = 0;
                    _.samplesMax = Infinity;
                    _.ison = false;
                    timbre.fn.do_event(this, "ended");
                    mode = _.mode;
                    samplesMax = _.samplesMax;
                    samples    = _.samples;
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
            _.mode = mode;
            _.samples    = samples + imax;
            _.samplesMax = samplesMax;
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return ADSREnvelope;
}());
timbre.fn.register("adsr", ADSREnvelope);


var Tween = (function() {
    var Tween = function() {
        initialize.apply(this, arguments);
    }, $this = Tween.prototype;
    
    Object.defineProperty($this, "type", {
        set: function(value) {
            var f;
            if (typeof value === "string") {
                if ((f = Tween.functions[value]) !== undefined) {
                    this._.type = value;
                    this._.func = f;
                }
            }
        },
        get: function() { return this._.type; }
    });
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._.d = value;
            }
        },
        get: function() { return this._.d; }
    });
    Object.defineProperty($this, "start", {
        set: function(value) {
            if (typeof value === "number") {
                this._.start = value;
            }
        },
        get: function() { return this._.start; }
    });
    Object.defineProperty($this, "stop", {
        set: function(value) {
            if (typeof value === "number") {
                this._.stop = value;
            }
        },
        get: function() { return this._.stop; }
    });
    
    var initialize = function(_args) {
        var type, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            (Tween.functions[_args[i]]) !== undefined) {
            type = _args[i++];
        } else {
            type = "linear";
        }
        if (typeof _args[i] === "number") {
            _.d = _args[i++];
        } else {
            _.d = 1000;
        }
        if (typeof _args[i] === "number") {
            _.start = _args[i++];
        } else {
            _.start = 0;
        }
        if (typeof _args[i] === "number") {
            _.stop = _args[i++];
        } else {
            _.stop = 1;
        }
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        
        _.phase     = 0;
        _.phaseStep = 0;
        _.value     = 0;
        _.ison   = false;
        this.type = type;        
    };
    timbre.fn.set_kr_only($this);
    
    $this.clone = function() {
        return new Tween([this.type, this.d, this.start, this.stop, this.mul, this.add]);
    };
    
    $this.bang = function() {
        var _ = this._;
        var diff;
        diff = _.stop - _.start;
        _.ison   = true;
        _.phase     = 0;
        _.phaseStep = timbre.cellsize / (_.d / 1000 * timbre.samplerate);
        _.value     = _.func(0) * diff + _.start;
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        var diff;
        diff = _.stop - _.start;
        _.ison   = true;
        _.phase     = 0;
        _.phaseStep = timbre.cellsize / (_.d / 1000 * timbre.samplerate);
        _.value     = _.func(0) * diff + _.start;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var value, diff, changed, ended;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            if (_.ison) {
                _.phase += _.phaseStep;
                if (_.phase >= 1.0) {
                    _.phase = 1.0;
                    _.ison = false;
                    ended = true;
                } else {
                    ended = false;
                }
                diff = _.stop - _.start;
                _.value = _.func(_.phase) * diff + _.start;
                changed = true;
            } else {
                changed = false;
            }
            value = _.value * _.mul + _.add;
            for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                cell[i] = value;
            }
            if (changed && this.onchanged) this.onchanged(_.value);
            if (ended) timbre.fn.do_event(this, "ended");
            this.seq_id = seq_id;
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



var Percussive = (function() {
    var Percussive = function() {
        initialize.apply(this, arguments);
    }, $this = Percussive.prototype;
    
    Object.defineProperty($this, "d", {
        set: function(value) {
            if (typeof value === "number") {
                this._.d = value;
            }
        },
        get: function() { return this._.d; }
    });
    
    var initialize = function(_args) {
        var i, _;

        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "number") {
            _.d = _args[i++];
        } else {
            _.d = 100.0;
        }
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        _.samples = 0;
        _.dx = timbre.cellsize / _.samples;
        _.x  = 0;
    };
    timbre.fn.set_kr_only($this);
    
    $this.clone = function() {
        return new Percussive([this.d, this.mul, this.add]);
    };
    
    $this.on = function() {
        var _ = this._;
        _.ison = true;
        _.samples = (timbre.samplerate * (_.d / 1000))|0;
        _.dx = timbre.cellsize / _.samples;
        _.x  = 1.0;
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.bang = function() {
        var _ = this._;
        _.ison = true;
        _.samples = (timbre.samplerate * (_.d / 1000))|0;
        _.dx = timbre.cellsize / _.samples;
        _.x  = 1.0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, val;
        var x, dx, samples;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            x  = _.x;
            dx = _.dx;
            samples = _.samples;
            val = x * _.mul + _.add;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = val;
            }
            x -= dx;
            if (x < 0.0) x = 0.0;
            if (samples > 0) {
                samples -= imax;
                if (samples <= 0) {
                    _.samples = 0;
                    _.ison = false;
                    timbre.fn.do_event(this, "ended");
                    x  = _.x;
                    samples = _.samples;
                }
            }
            
            _.x = x;
            _.samples = samples;
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return Percussive;
}());
timbre.fn.register("perc", Percussive);

// __END__

describe("adsr", function() {
    var instance = timbre("adsr", 1000, 1000, 0.2, 200);
    object_test(ADSREnvelope, instance);
});
describe("perc", function() {
    var instance = timbre("perc", 1000);
    object_test(Percussive, instance);
});
