/**
 * PhaseOscillator
 * v 0. 2. 0: first version
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
                set: function(val) {
                    this._.phase = timbre(val);
                },
                get: function() { return this._.phase; }
            },
            fb: {
                set: function(val) {
                    if (typeof val === "number") this._.fb = val;
                },
                get: function() { return this._.fb; }
            }
        }, // properties
        copies: [
            "osc.wave", "osc.getWavetable()", "osc.setWavetable()"
        ]
    }), Oscillator = timbre.fn.getClass("osc");
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.wave = new Float32Array(1024);
        _.px   = 0;
        _.fb   = 0;
        
        var i = 0;
        this.wave = "sin";
        if (typeof _args[i] === "function") {
            this.wave = _args[i++];
        } else if (_args[i] instanceof Float32Array) {
            this.wave = _args[i++];
        } else if (typeof _args[i] === "string") {
            this.wave = _args[i++];
        }
        if (_args[i] !== undefined) {
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
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = T("oscx", _.wave);
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
        var index, delta, x0, x1, xx;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var phase = _.phase.seq(seq_id);
            var fb    = _.fb;
            var mul = _.mul, add = _.add;
            var wave = _.wave, px = _.px;
            
            if (_.ar && _.phase.isAr) { // ar-mode
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    xx = (phase[i] + px) * 1024;
                    while (xx < 0) xx += 1024;
                    index = xx|0; delta = xx - index;
                    x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                    xx = (1.0 - delta) * x0 + delta * x1;
                    px = xx * fb;
                    cell[i] = xx * mul + add;
                }
                _.px = px;
            } else {                    // kr-mode
                xx = phase[0] * 1024;
                while (xx < 0) xx += 1024;
                index = xx|0; delta = xx - index;
                x0 = wave[index & 1023]; x1 = wave[(index+1) & 1023];
                xx = (1.0 - delta) * x0 + delta * x1;
                for (i = imax = timbre.cellsize; i--; ) {
                    cell[i] = xx * mul + add;
                }
            }
        }
        
        return cell;
    };
    
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
