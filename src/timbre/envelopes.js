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
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    var STATUSES = ["off","delay","a","d","s","r"];
    
    Object.defineProperty($this, "status", {
        get: function() { return STATUSES[this._.status+1]; }
    });
    Object.defineProperty($this, "delayTime", {
        set: function(value) {
            if (typeof value === "number") {
                this._.delayTime = value;
            }
        },
        get: function() { return this._.delayTime; }
    });
    Object.defineProperty($this, "attackTime", {
        set: function(value) {
            if (typeof value === "number") {
                this._.attackTime = value;
            }
        },
        get: function() { return this._.attackTime; }
    });
    Object.defineProperty($this, "decayTime", {
        set: function(value) {
            if (typeof value === "number") {
                this._.decayTime = value;
            }
        },
        get: function() { return this._.decayTime; }
    });
    Object.defineProperty($this, "sustainLevel", {
        set: function(value) {
            if (typeof value === "number") {
                this._.sustainLevel = value;
            }
        },
        get: function() { return this._.sustainLevel; }
    });
    Object.defineProperty($this, "releaseTime", {
        set: function(value) {
            if (typeof value === "number") {
                this._.releaseTime = value;
            }
        },
        get: function() { return this._.releaseTime; }
    });
    Object.defineProperty($this, "sustainTime", {
        set: function(value) {
            if (typeof value === "number") {
                this._.sustainTime = value;
            }
        },
        get: function() { return this._.sustainTime; }
    });
    Object.defineProperty($this, "reversed", {
        set: function(value) {
            if (typeof value === "boolean") {
                this._.reversed = value;
            }
        },
        get: function() { return this._.reversed; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        _ = this._ = {};
        
        i = 0;
        _.attackTime   = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.decayTime    = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.sustainLevel = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.releaseTime  = (typeof _args[i] === "number") ? _args[i++] : 0;
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        
        _.ison = true;
        _.delayTime   = 0;
        _.sustainTime = Infinity;
        _.reversed = false;
        
        _.status = -1;
        _.samples = Infinity;
        _.x0 = 0; _.x1 = 0; _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("adsr",
                        _.attackTime, _.decayTime, _.sustainLevel, _.releaseTime,
                        _.mul, _.add);
        newone._.delayTime   = _.delayTime;
        newone._.sustainTime = _.sustainTime;
        newone._.reversed    = _.reversed;
        return newone;
    };
    
    $this.bang = function(mode) {
        var _ = this._;
        
        // off -> delay
        _.status  = 0;
        _.samples = (timbre.samplerate * (_.delayTime / 1000))|0;
        _.x0 = 0; _.x1 = 1; _.dx = 0;
        _.currentTime = 0;
        
        timbre.fn.do_event(this, "bang");
        return this;
    };

    $this.keyoff = function() {
        var _ = this._;
        
        if (_.status <= 3) {
            // (delay, A, D, S) -> R
            _.status  = 4;
            _.samples = (timbre.samplerate * (_.releaseTime / 1000))|0;
            _.x1 = _.x0; _.x0 = 1; _.dx = -timbre.cellsize / _.samples;
            timbre.fn.do_event(this, "R");
        }
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x, i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            while (_.samples <= 0) {
                if (_.status === 0) { // delay -> A
                    _.status = 1;
                    _.samples = (timbre.samplerate * (_.attackTime / 1000))|0;
                    _.dx = timbre.cellsize / _.samples;
                    timbre.fn.do_event(this, "A");
                    continue;
                }
                if (_.status === 1) { // A -> D
                    _.status = 2;
                    _.samples += (timbre.samplerate * (_.decayTime / 1000))|0;
                    _.x0 = 1;
                    _.dx = -timbre.cellsize * (1 - _.sustainLevel) / _.samples;
                    timbre.fn.do_event(this, "D");
                    continue;
                }
                if (_.status === 2) { // D -> S
                    if (_.sustainLevel === 0) {
                        _.status = 4;
                        continue;
                    }
                    _.status = 3;
                    _.x0 = _.sustainLevel;
                    if (_.sustainTime === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * (_.sustainTime / 1000))|0;
                        _.dx = -timbre.cellsize * _.sustainLevel / _.samples;
                    }
                    timbre.fn.do_event(this, "S");
                    continue;
                }
                if (_.status <= 4) { // (S, R) -> end
                    _.status  = -1;
                    _.samples = Infinity;
                    _.x0 = _.x1 = _.dx = 0;
                    timbre.fn.do_event(this, "ended");
                    continue;
                }
            }
            
            if (_.reversed) {
                x = (1.0 - (_.x0 * _.x1)) * _.mul + _.add;
            } else {
                x = (_.x0 * _.x1) * _.mul + _.add;
            }
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            _.x0 += _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;
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
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
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
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("tween", _.type, _.d, _.start, _.stop);
        newone._.mul = _.mul;
        newone._.add = _.add;
        return newone;
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



var PercussiveEnvelope = (function() {
    var PercussiveEnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = PercussiveEnvelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    Object.defineProperty($this, "duration", {
        set: function(value) {
            if (typeof value === "number") {
                this._.duration = value;
            }
        },
        get: function() { return this._.duration; }
    });
    Object.defineProperty($this, "iteration", {
        set: function(value) {
            if (typeof value === "number") {
                this._.iteration = value;
            }
        },
        get: function() { return this._.iteration; }
    });
    Object.defineProperty($this, "decayRate", {
        set: function(value) {
            if (typeof value === "number") {
                this._.decayRate = value;
            }
        },
        get: function() { return this._.decayRate; }
    });
    Object.defineProperty($this, "reversed", {
        set: function(value) {
            if (typeof value === "boolean") {
                this._.reversed = value;
            }
        },
        get: function() { return this._.reversed; }
    });
    Object.defineProperty($this, "currentTime", {
        get: function() { return this._.currentTime; }
    });
    
    var initialize = function(_args) {
        var i, _;

        this._ = _ = {};
        
        i = 0;
        
        _.duration  = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.iteration = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.decayRate = (typeof _args[i] === "number") ? _args[i++] : 0.2;
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        if (typeof _args[i] === "function") {
            this.onended = _args[i++];
        }
        
        _.ison = true;
        _.reversed = false;

        _.samples = Infinity;
        _.x = 0; _.dx = 0;
        _.count  = 0;
        _.volume = 1;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        return timbre("perc", _.duration, _.iteration, _.decayRate,
                      _.mul, _.add, this.onended);
    };
    
    $this.bang = function() {
        var _ = this._;
        _.samples = (timbre.samplerate * (_.duration / 1000))|0;
        _.dx = timbre.cellsize / _.samples;
        _.x = 1;
        _.count  = _.iteration;
        _.volume = 1;
        _.currentTime = 0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, x, i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            while (_.samples <= 0) {
                if (--_.count <= 0) {
                    _.samples = Infinity;
                    _.x = 0;
                    timbre.fn.do_event(this, "ended");
                } else {
                    _.volume *= (1 - _.decayRate);
                    _.x = _.volume;
                    _.samples = (timbre.samplerate * (_.duration * _.x / 1000))|0;
                    _.dx = (timbre.cellsize * _.x) / _.samples;
                }
            }
            if (_.reversed) {
                x = (1 - _.x) * _.mul + _.add;
            } else {
                x = _.x * _.mul + _.add;
            }
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            _.x -= _.dx;
            _.samples -= imax;
            _.currentTime += imax * 1000 / timbre.samplerate;;
            
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return PercussiveEnvelope;
}());
timbre.fn.register("perc", PercussiveEnvelope);

// __END__

describe("adsr", function() {
    object_test(ADSREnvelope, "adsr");
});
describe("tween", function() {
    object_test(Tween, "tween");
});
describe("perc", function() {
    object_test(PercussiveEnvelope, "perc");
});
