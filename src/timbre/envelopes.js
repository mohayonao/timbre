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
    Object.defineProperty($this, "delay", {
        set: function(value) {
            if (typeof value === "number") {
                this._.delay = value;
            }
        },
        get: function() { return this._.delay; }
    });
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
    Object.defineProperty($this, "sl", {
        set: function(value) {
            if (typeof value === "number") {
                this._.sl = value;
            }
        },
        get: function() { return this._.sl; }
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
        _.a  = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.d  = (typeof _args[i] === "number") ? _args[i++] : 0;
        _.sl = (typeof _args[i] === "number") ? _args[i++] : 0;                
        _.r  = (typeof _args[i] === "number") ? _args[i++] : 0;
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        
        _.ison = true;
        _.delay   = 0;
        _.s = Infinity;
        _.reversed = false;
        
        _.status = -1;
        _.samples = Infinity;
        _.x0 = 0; _.x1 = 0; _.dx = 0;
        _.currentTime = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        var args, i, imax;
        newone = timbre("adsr", _.a, _.d, _.sl, _.r, _.mul, _.add);
        newone._.delay = _.delay;
        newone._.s = _.s;
        newone._.reversed = _.reversed;
        return newone;
    };
    
    $this.bang = function(mode) {
        var _ = this._;
        
        // off -> delay
        _.status  = 0;
        _.samples = (timbre.samplerate * (_.delay / 1000))|0;
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
            _.samples = (timbre.samplerate * (_.r / 1000))|0;
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
                    _.samples = (timbre.samplerate * (_.a / 1000))|0;
                    _.dx = timbre.cellsize / _.samples;
                    timbre.fn.do_event(this, "A");
                    continue;
                }
                if (_.status === 1) { // A -> D
                    _.status = 2;
                    _.samples += (timbre.samplerate * (_.d / 1000))|0;
                    _.x0 = 1;
                    _.dx = -timbre.cellsize * (1 - _.sl) / _.samples;
                    timbre.fn.do_event(this, "D");
                    continue;
                }
                if (_.status === 2) { // D -> S
                    if (_.sl === 0) {
                        _.status = 4;
                        continue;
                    }
                    _.status = 3;
                    _.x0 = _.sl;
                    if (_.s === Infinity) {
                        _.samples = Infinity;
                        _.dx = 0;
                    } else {
                        _.samples += (timbre.samplerate * (_.s / 1000))|0;
                        _.dx = -timbre.cellsize * _.sl / _.samples;
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


var PercussiveEnvelope = (function() {
    var PercussiveEnvelope = function() {
        initialize.apply(this, arguments);
    }, $this = PercussiveEnvelope.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");

    Object.defineProperty($this, "delayTime", {
        set: function(value) {
            if (typeof value === "number") {
                this._.delayTime = value;
            }
        },
        get: function() { return this._.delayTime; }
    });
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
        _.delayTime = 0;
        _.reversed = false;
        
        _.status  = -1;        
        _.samples = Infinity;
        _.x0 = 0; _.dx = 0;
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

        _.status  = 0;
        _.samples = (timbre.samplerate * (_.delayTime / 1000))|0;
        _.x0 = 0; _.dx = 0;
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
                if (_.status === 0) {
                    _.status = 1;
                    _.samples = (timbre.samplerate * (_.duration / 1000))|0;
                    _.x0 = 1;
                    _.dx = timbre.cellsize / _.samples;
                    continue;
                }
                
                if (_.status === 1) {
                    if (--_.count <= 0) {
                        _.status  = -1;
                        _.samples = Infinity;
                        _.x0 = 0; _.dx = 0;
                        timbre.fn.do_event(this, "ended");
                    } else {
                        _.volume *= (1 - _.decayRate);
                        _.x0 = _.volume;
                        _.samples += (timbre.samplerate * (_.duration * _.x0 / 1000))|0;
                        _.dx = (timbre.cellsize * _.x0) / _.samples;
                    }
                    continue;
                }

            }
            if (_.reversed) {
                x = (1 - _.x0) * _.mul + _.add;
            } else {
                x = _.x0 * _.mul + _.add;
            }
            for (i = 0, imax = cell.length; i < imax; ++i) {
                cell[i] = x;
            }
            _.x0 -= _.dx;
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
describe("perc", function() {
    object_test(PercussiveEnvelope, "perc");
});
