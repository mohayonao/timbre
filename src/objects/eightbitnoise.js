/**
 * EightBitNoise: v12.07.13
 * 8bit Noise Generator
 * v12.07.12: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EightBitNoise = (function() {
    var EightBitNoise = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(EightBitNoise, {
        base: "ar-kr",
        properties: {
            freq: {
                set: function(value) {
                    this._.freq = timbre(value);
                },
                get: function() { return this._.freq; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;

        this._ = _ = {};
        i = 0;
        
        if (typeof _args[i] !== "undefined") {
            this.freq = _args[i++];
        } else {
            this.freq = 440;
        }
        
        _.phase = 0;
        _.noise = 1;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("8bitnoise");
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        this._.phase = 0;
        this._.noise = 1;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, phase, noise;
        var freq, phaseStep, mul, add;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            freq  = _.freq.seq(seq_id)[0];
            phase = _.phase;
            noise = _.noise;
            mul   = _.mul;
            add   = _.add;
            
            phaseStep = freq / timbre.samplerate;
            
            for (i = 0, imax = cell.length; i < imax; ++i) {
                if (phase >= 0.25) {
                    noise = Math.random() < 0.5 ? -1 : +1;
                }
                cell[i] = noise * mul + add;
                phase += phaseStep;
                while (phase > 1) phase -= 1;
            }
            _.phase = phase;
            _.noise = noise;
            
            if (!_.ar) { // kr-mode
                for (i = imax; i--; ) {
                    cell[i] = cell[0];
                }
            }
        }
        
        return cell;
    };

    return EightBitNoise;
}());
timbre.fn.register("8bitnoise", EightBitNoise);


// __END__
if (module.parent && !module.parent.parent) {
    describe("8bitnoise", function() {
        object_test(EightBitNoise, "8bitnoise");
    });
}
