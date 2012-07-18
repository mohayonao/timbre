/**
 * FrequencyNoise
 * v12.07.18: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var FrequencyNoise = (function() {
    var FrequencyNoise = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(FrequencyNoise, {
        base: "ar-kr",
        properties: {
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
        
        _.x = 0;
        _.y = 1;
        
        var i = 0;
        if (typeof _args[i] !== "undefined") {
            this.freq = _args[i++];
        } else {
            this.freq = 440;
        }
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
    };
    
    $this.clone = function(deep) {
        var _ = this._;
        var newone = timbre("8bitnoise");
        if (deep) {
            newone._.freq = _.freq.clone(true);
        } else {
            newone._.freq = _.freq;
        }
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.bang = function() {
        var _ = this._;
        _.x = 0; _.y = 1;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var freq = _.freq.seq(seq_id)[0];
            var x = _.x, y = _.y;
            var mul = _.mul, add = _.add;
            var dx  = freq / timbre.samplerate;
            var rnd = Math.random;
            
            for (var i = 0, imax = cell.length; i < imax; ++i) {
                if (x >= 0.25) {
                    y = rnd() * 2 - 1;
                    do { x -= 0.25 } while (x >= 0.25);
                }
                cell[i] = y * mul + add;
                x += dx;
            }
            _.x = x; _.y = y;
            
            if (!_.ar) { // kr-mode
                for (i = imax; i--; ) cell[i] = cell[0];
            }
        }
        
        return cell;
    };
    
    return FrequencyNoise;
}());
timbre.fn.register("fnoise", FrequencyNoise);


// __END__
if (module.parent && !module.parent.parent) {
    describe("fnoise", function() {
        object_test(FrequencyNoise, "fnoise");
    });
}
