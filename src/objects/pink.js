/**
 * PinkNoise: 0.3.5
 * Pink noise generator
 * [ar-kr]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var PinkNoise = (function() {
    var PinkNoise = function() {
        initialize.apply(this, arguments);
    }, $this = PinkNoise.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    var initialize = function(_args) {
        this._ = {};
        this._.b0 = 0;
        this._.b1 = 0;
        this._.b2 = 0;
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("pink"), deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, r, b0, b1, b2;
        var mul, add, x, i, j;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            b0  = _.b0;
            b1  = _.b1;
            b2  = _.b2;
            mul = _.mul;
            add = _.add;
            
            r = Math.random;
            for (i = cell.length; i--; ) {
                x = r() * 2.0 - 1.0;
                b0 = 0.99765 * b0 + x * 0.0990460;
                b1 = 0.96300 * b1 + x * 0.2965164;
                b2 = 0.57000 * b2 + x * 1.0526913;
                x = b0 + b1 + b2 + x * 0.1848;
                cell[i] = x * mul + add;
            }
            _.b0 = b0;
            _.b1 = b1;
            _.b2 = b2;
        }
        return cell;
    };
    
    return PinkNoise;
}());
timbre.fn.register("pink", PinkNoise);

// __END__
if (module.parent && !module.parent.parent) {
    describe("pink", function() {
        object_test(PinkNoise, "pink");
    });
}
