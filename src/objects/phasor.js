/**
 * Phasor
 * v 0. 2. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Phasor = (function() {
    var Phasor = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Phasor, {
        base: "ar-kr",
        properties: {
            freq: {
                set: function(val) {
                    this._.freq = timbre(val);
                },
                get: function() { return this._.freq; }
            },
            fmul: {
                set: function(val) {
                    if (typeof val === "number" && val >= 0) {
                        this._.fmul = val;
                    }
                },
                get: function() { return this._.fmul; }
            },
            phase: {
                set: function(val) {
                    if (typeof val === "number") {
                        while (val >= 1.0) val -= 1.0;
                        while (val <  0.0) val += 1.0;
                        this._.phase = this._.x = val;
                    }
                },
                get: function() { return this._.phase; }
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
        _.fmul  = typeof _args[i] === "number" ? _args[i++] : 1;
        _.phase = typeof _args[i] === "number" ? _args[i++] : 0;
        if (_.fmul < 0) _.fmul = 0;
        
        this.phase = _.phase;
        _.x     = _.phase;
        _.coeff = 1 / timbre.samplerate;
    };

    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = T("phasor");
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        newone._.fmul  = _.fmul;
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
        var freq, mul, add;
        var x, dx, coeff, xx;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            freq  = _.freq.seq(seq_id);
            mul   = _.mul;
            add   = _.add;
            x     = _.x;
            coeff = _.coeff * _.fmul;
            
            if (_.ar) {
                if (_.freq.isAr) {
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = x * mul + add;
                        x += freq[i] * coeff;
                        while (x > 1.0) x -= 1.0;
                    }
                } else {
                    dx = freq[0] * coeff;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = x * mul + add;
                        x += dx;
                        while (x > 1.0) x -= 1.0;
                    }
                }
            } else {
                xx = _.x * _.mul + add;
                for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                    cell[i] = xx;
                }
                x += freq[0] * coeff * imax;
                while (x > 1.0) x -= 1.0;
            }
            _.x = x;
        }
        return cell;
    };
    
    return Phasor;
}());
timbre.fn.register("phasor", Phasor);

// __END__
if (module.parent && !module.parent.parent) {
    describe("phasor", function() {
        object_test(Phasor, "phasor");
    });
}
