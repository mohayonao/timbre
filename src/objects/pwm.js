/**
 * Pwm: v12.07.13
 * v0.3.3: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Pwm = (function() {
    var Pwm = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Pwm, {
        base: "ar-kr",
        properties: {
            width: {
                set: function(value) {
                    this._.width = timbre(value);
                },
                get: function() { return this._.width; }
            },
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
            this.width = _args[i++];
        } else {
            this.width = 0.5;
        }
        if (typeof _args[i] !== "undefined") {
            this.freq = _args[i++];
        } else {
            this.freq = 440;
        }
        
        _.x     = 0;
        _.coeff = 1 / timbre.samplerate;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = T("pwm");
        if (deep) {
            newone._.width = _.width.clone(true);
            newone._.freq  = _.freq.clone(true);
        } else {
            newone._.width = _.width;
            newone._.freq  = _.freq;
        }
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        this._.x = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell;
        var width, freq, mul, add;
        var x, dx, coeff, xx;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            width = _.width.seq(seq_id)[0];
            freq  = _.freq .seq(seq_id);
            mul   = _.mul;
            add   = _.add;
            x     = _.x;
            coeff = _.coeff;
            if (_.ar) {
                if (_.freq.isAr) {
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = ((x < width) ? -1 : +1) * mul + add;
                        x += freq[i] * coeff;
                        while (x > 1.0) x -= 1.0;
                    }
                } else {
                    dx = freq[0] * coeff;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = ((x < width) ? -1 : +1) * mul + add;
                        x += dx;
                        while (x > 1.0) x -= 1.0;
                    }
                }
            } else {
                xx = ((_.x < width) ? -1 : +1) * _.mul + add;
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
    
    return Pwm;
}());
timbre.fn.register("pwm", Pwm);

// __END__
if (module.parent && !module.parent.parent) {
    describe("pwm", function() {
        object_test(Pwm, "pwm");
    });
}
