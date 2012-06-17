/**
 * Avg: <draft>
 * Signal Average
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Avg = (function() {
    var Avg = function() {
        initialize.apply(this, arguments);
    }, $this = Avg.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var x, tmp, i, j;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;

            x  = args.length;
            if (x > 0) {            
                if (_.ar) {
                    cell = timbre.fn.sumargsAR(this, args, seq_id);
                    for (i = cell.length; i--; ) {
                        cell[i] = (cell[i] / x) * mul + add;
                    }
                } else {
                    tmp = timbre.fn.sumargsKR(this, args, seq_id);
                    tmp = (tmp / x) * mul + add;
                    for (j = cell.length; j--; ) {
                        cell[j] = tmp;
                    }
                }
            } else {
                for (i = cell.length; i--; ) {
                    cell[i] = add;
                }
            }
        }
        return cell;
    };
    
    return Avg;
}());
timbre.fn.register("avg", Avg);

// __END__
if (module.parent && !module.parent.parent) {
    describe("avg", function() {
        object_test(Avg, "avg");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([0.0, 0.1, 0.2, 0.3, -0.4, -0.5, -0.6, -0.7]); 
            i2.cell = new Float32Array([0.2,-0.4, 0.9,-1.0, -0.8,  1.6, 10.6, -0.2]);
            
            it("ar-mode", function() {
                var instance = timbre("avg", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([0.2/2, -0.3/2, 1.1/2, -0.7/2, -1.2/2, 1.1/2, 10.0/2, -0.9/2])
                );
            });
            it("kr", function() {
                var instance = timbre("avg", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([0.2/2, 0.2/2, 0.2/2, 0.2/2, 0.2/2, 0.2/2, 0.2/2, 0.2/2])
                );
            });
        });
    });
}
