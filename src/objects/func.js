/**
 * FuncOscillator: v12.07.13
 * Signal generator
 * [ar-kr] TODO: kr
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var FuncOscillator = (function() {
    var FuncOscillator = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(FuncOscillator, {
        base: "ar-kr",
        properties: {
            func: {
                set: function(value) {
                    if (typeof value === "function") this._.func = value;
                },
                get: function() { return this._.func; }
            },
            numOfSamples: {
                set: function(value) {
                    if (typeof value === "number") {
                        this._.saved = new Float32Array(value);
                        this._.numOfSamples = value;
                    }
                },
                get: function() { return this._.numOfSamples; }
            },
            freq: {
                set: function(value) {
                    this._.freq = timbre(value);
                },
                get: function() { return this._.freq; }
            },
            phase: {
                set: function(value) {
                    if (typeof value === "number") {
                        while (value >= 1.0) value -= 1.0;
                        while (value <  0.0) value += 1.0;
                        this._.phase = this._.x = value;
                    }
                },
                get: function() { return this._.phase; }
            }
        } // properties
    });
    
    
    var DEFAULT_FUNCTION = function(x) { return x; };
    
    var initialize = function(_args) {
        var numOfSamples, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "number" && _args[i] > 0) {
            _.numOfSamples = _args[i++]|0;
        } else {
            _.numOfSamples = 0;
        }
        if (typeof _args[i] === "function") {
            _.func = _args[i++];
        } else {
            _.func = DEFAULT_FUNCTION;    
        }
        if (typeof _args[i] !== "undefined") {
            this.freq = _args[i++];
        } else {
            this.freq = 440;
        }
        
        _.saved = new Float32Array(_.numOfSamples);
        _.index = 0;
        _.phase = _.x = 0;
        _.coeff = 1 / timbre.samplerate;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("func", _.func, null, _.numOfSamples);
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        newone._.phase = _.phase;
        return timbre.fn.copyBaseArguments(this, newone, deep);        
    };
    
    $this.bang = function() {
        this._.x = this._.phase;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var func, freq, x, coeff;
        var mul, add, saved, index;
        var tmp, i, imax, j, jmax, k;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (this.seq_id !== seq_id) {
            this.seq_id = seq_id;
            
            func  = _.func;
            freq  = _.freq.seq(seq_id);
            
            x     = _.x;
            coeff = _.coeff;
            mul   = _.mul;
            add   = _.add;
            
            saved = _.saved;
            j     = _.index; jmax = saved.length;
            for (i = 0, imax = cell.length; i < imax; ++i, ++j) {
                if (jmax === 0) {
                    cell[i] = func(x) * mul + add;
                } else {
                    if (j >= jmax) {
                        tmp = func(x, freq[i] * coeff);
                        if (jmax !== 0) {
                            for (k = tmp.length; k--; ) {
                                saved[k] = tmp[k] || 0;
                            }
                        }
                        j = 0;
                    }
                    cell[i] = saved[j] * mul + add;
                }
                x += freq[i] * coeff;
                while (x >= 1.0) x -= 1.0;
            }
            _.index = j;
            _.x = x;
        }
        return cell;
    };
    
    return FuncOscillator;
}());
timbre.fn.register("func", FuncOscillator);

// __END__
if (module.parent && !module.parent.parent) {
    describe("func", function() {
        object_test(FuncOscillator, "func");
    });
}
