/**
 * WhiteNoise: 0.1.0
 * White noise generator
 * [ar-kr]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var WhiteNoise = (function() {
    var WhiteNoise = function() {
        initialize.apply(this, arguments);
    }, $this = WhiteNoise.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("noise"), deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, r;
        var mul, add, x, i;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            mul = _.mul;
            add = _.add;
            if (_.ar) {
                r = Math.random;
                for (i = cell.length; i--; ) {
                    cell[i] = (r() * 2.0 - 1.0) * mul + add;
                }
            } else {
                x = (Math.random() * 2.0 - 1.0) * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    return WhiteNoise;
}());
timbre.fn.register("noise", WhiteNoise);

// __END__
if (module.parent && !module.parent.parent) {
    describe("noise", function() {
        object_test(WhiteNoise, "noise");
    });
}
