/**
 * PinkNoise
 * Pink noise generator
 * v 0. 3. 5: first version
 * v12.07.18: add args ".mul"
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var PinkNoise = (function() {
    var PinkNoise = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(PinkNoise, {
        base: "ar-kr"
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.b0 = 0; _.b1 = 0; _.b2 = 0;
        
        var i = 0;
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("pink"), deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (!_.ison) return timbre._.none;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var b0 = _.b0, b1 = _.b1, b2 = _.b2;
            var mul = _.mul, add = _.add;
            
            var rnd = Math.random;
            for (var i = cell.length; i--; ) {
                var x = rnd() * 2 - 1;
                b0 = 0.99765 * b0 + x * 0.0990460;
                b1 = 0.96300 * b1 + x * 0.2965164;
                b2 = 0.57000 * b2 + x * 1.0526913;
                x = b0 + b1 + b2 + x * 0.1848;
                cell[i] = x * mul + add;
            }
            _.b0 = b0; _.b1 = b1; _.b2 = b2;
            
            if (!_.ar) { // kr-mode
                for (i = cell.length; i--; ) cell[i] = cell[0];
            }
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
