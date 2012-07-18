/**
 * WhiteNoise
 * White noise generator
 * v 0. 1. 0: first version
 * v12.07.18: add args ".mul"
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var WhiteNoise = (function() {
    var WhiteNoise = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(WhiteNoise, {
        base: "ar-kr"
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        var i = 0;
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("noise"), deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            var mul = _.mul;
            var add = _.add;
            if (_.ar) {
                var r = Math.random;
                for (var i = cell.length; i--; ) {
                    cell[i] = (r() * 2.0 - 1.0) * mul + add;
                }
            } else {
                var x = (Math.random() * 2.0 - 1.0) * mul + add;
                for (var i = cell.length; i--; ) {
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
