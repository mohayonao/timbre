/**
 * Pwm
 * Pulse Width Modulation
 * v 0. 3. 3: first version
 * v12.07.18: add 'pwm125', 'pwm25', 'pwm50'
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
                set: function(val) {
                    this._.width = timbre(val);
                },
                get: function() { return this._.width; }
            },
            freq: {
                set: function(val) {
                    this._.freq = timbre(val);
                },
                get: function() { return this._.freq; }
            }
        } // properties
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.x     = 0;
        _.coeff = 1 / timbre.samplerate;
        
        var i = 0;
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
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];    
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];    
        }
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = T("pwm");
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
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var width = _.width.seq(seq_id)[0];
            var freq  = _.freq .seq(seq_id);
            var mul = _.mul, add = _.add;
            var x = _.x, coeff = _.coeff;
            
            if (_.ar) { // ar-mode
                if (_.freq.isAr) {
                    for (var i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = ((x < width) ? +1 : -1) * mul + add;
                        x += freq[i] * coeff;
                        while (x > 1) x -= 1;
                    }
                } else {
                    var dx = freq[0] * coeff;
                    for (var i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = ((x < width) ? +1 : -1) * mul + add;
                        x += dx;
                        while (x > 1) x -= 1;
                    }
                }
            } else {    // kr-mode
                var xx = ((_.x < width) ? +1 : -1) * mul + add;
                for (var i = 0, imax = timbre.cellsize; i < imax; ++i) {
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

timbre.fn.register("pwm125", Pwm, function(_args) {
    return new Pwm([0.125].concat(_args));
});
timbre.fn.register("pwm25", Pwm, function(_args) {
    return new Pwm([0.25].concat(_args));
});
timbre.fn.register("pwm50", Pwm, function(_args) {
    return new Pwm([0.5].concat(_args));
});

// __END__
if (module.parent && !module.parent.parent) {
    describe("pwm", function() {
        object_test(Pwm, "pwm");
    });
}
