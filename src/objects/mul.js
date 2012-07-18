/**
 * Multiply
 * Multiply signals
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Multiply = (function() {
    var Multiply = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Multiply, {
        base: "ar-kr"
    });
    
    var initialize = function(_args) {
        this.args = _args.map(timbre);
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("*"), deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var tmp, i, imax, j, jmax;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var args = this.args.slice(0);
            var mul = _.mul, add = _.add;
            
            jmax = timbre.cellsize;
            if (_.ar) { // ar-mode
                for (j = jmax; j--; ) cell[j] = mul;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) cell[j] *= tmp[j];
                }
                if (add) {
                    for (j = jmax; j--; ) cell[j] += add;
                }
            } else {    // kr-mode
                tmp = mul;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp *= args[i].seq(seq_id)[0];
                }
                tmp += add;
                for (j = jmax; j--; ) cell[j] = tmp;
            }
        }
        return cell;
    };
    
    return Multiply;
}());
timbre.fn.register("*", Multiply);

// __END__
if (module.parent && !module.parent.parent) {
    describe("*", function() {
        object_test(Multiply, "*");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([ 0,-1, 2,-3, 4, -5, 6,-7]);
            i2.cell = new Float32Array([-1,-2, 3, 5,-8,-13,21,34]);
            it("ar-mode", function() {
                var instance = T("*", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([-0,2,6,-15,-32,65,126,-238])
                );
            });
            it("kr-mode", function() {
                var instance = T("*", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([0,0,0,0,0,0,0,0])
                );
            });
        });
    });
}
