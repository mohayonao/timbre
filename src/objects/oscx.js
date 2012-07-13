/**
 * PhaseOscillator: v12.07.13
 * v0.2.0: first version
 */
"use strict";

var timbre = require("../timbre");
require("./osc");
// __BEGIN__

var PhaseOscillator = (function() {
    var PhaseOscillator = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(PhaseOscillator, {
        base: "ar-kr",
        properties: {
            phase: {
                set: function(value) {
                    this._.phase = timbre(value);
                },
                get: function() { return this._.phase; }
            },
            fb: {
                set: function(value) {
                    if (typeof value === "number") this._.fb = value;
                },
                get: function() { return this._.fb; }
            }
        }, // properties
        copies: [
            "osc.wave"
        ]
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        i = 0;
        
        _.wave = new Float32Array(1024);
        if (typeof _args[i] === "function") {
            this.wave = _args[i++];
        } else if (typeof _args[i] === "object" && _args[i] instanceof Float32Array) {
            this.wave = _args[i++];
        } else if (typeof _args[i] === "string" && Oscillator.Wavetables[_args[i]]) {
            this.wave = _args[i++];
        } else {
            this.wave = "sin";
        }
        if (typeof _args[i] !== "undefined") {
            this.phase = _args[i++];
        } else {
            this.phase = 0;
        }
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];    
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];    
        }
        _.prevx = 0;
        _.fb    = 0;
    };

    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = T("oscx", _.wave);
        if (deep) {
            newone._.phase = _.phase.clone(true);
        } else {
            newone._.phase = _.phase;
        }
        newone._.fb = _.fb;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        this._.phase.bang();
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var phase, mul, add, wave;
        var x, prevx, fb;
        var index, delta, x0, x1, xx;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            phase = _.phase.seq(seq_id);
            fb    = _.fb;
            mul   = _.mul;
            add   = _.add;
            wave  = _.wave;
            prevx = _.prevx;
            
            if (_.ar && _.phase.isAr) {
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    x = (phase[i] + prevx) * 1024;
                    index = x|0;
                    delta = x - index;
                    x0 = wave[(index  ) & 1023];
                    x1 = wave[(index+1) & 1023];
                    xx = (1.0 - delta) * x0 + delta * x1;
                    prevx = xx * fb;
                    cell[i] = xx * mul + add;
                }
                _.prevx = prevx;
            } else {
                x = phase[0] * 1024;
                index = x|0;
                delta = x - index;
                x0 = wave[(index  ) & 1023];
                x1 = wave[(index+1) & 1023];
                xx = (1.0 - delta) * x0 + delta * x1;
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    cell[i] = xx * mul + add;
                }
            }
        }
        
        return cell;
    };

    $this.getWavetable = Oscillator.getWavetable;
    $this.setWavetable = Oscillator.setWavetable;
    
    return PhaseOscillator;
}());
timbre.fn.register("oscx", PhaseOscillator);

timbre.fn.register("sinx", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["sin"].concat(_args));
});
timbre.fn.register("cosx", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["cos"].concat(_args));
});
timbre.fn.register("pulsex", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["pulse"].concat(_args));
});
timbre.fn.register("trix", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["tri"].concat(_args));
});
timbre.fn.register("sawx", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["saw"].concat(_args));
});
timbre.fn.register("famix", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["fami"].concat(_args));
});
timbre.fn.register("konamix", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["konamix"].concat(_args));
});
timbre.fn.register("+sinx", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["+sin"].concat(_args));
});
timbre.fn.register("+cosx", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["+cos"].concat(_args));
});
timbre.fn.register("+trix", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["+tri"].concat(_args));
});
timbre.fn.register("+sawx", PhaseOscillator, function(_args) {
    return new PhaseOscillator(["+saw"].concat(_args));
});

// __END__
if (module.parent && !module.parent.parent) {
    describe("oscx", function() {
        object_test(PhaseOscillator, "oscx");
    });
}
