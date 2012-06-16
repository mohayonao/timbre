/**
 * Max: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Max = (function() {
    var Max = function() {
        initialize.apply(this, arguments);
    }, $this = Max.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add;
        var tmp, x, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            
            if (_.ar) {
                if (args.length > 0) {
                    tmp = args[0].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] = tmp[j];
                    }
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            if (cell[j] < tmp[j]) cell[j] = tmp[j];
                        }
                    }
                } else {
                    for (j = jmax; j--; ) {
                        cell[j] = 0;
                    }
                }
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            } else {
                if (args.length > 0) {
                    x = args[0].seq(seq_id)[0];
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id)[0];
                        if (x < tmp) x = tmp;
                    }
                } else {
                    x = 0;
                }
                x = x * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = x;
                }
            }
        }
        return cell;
    };
    
    return Max;
}());
timbre.fn.register("max", Max);

// __END__
if (module.parent && !module.parent.parent) {
    describe("max", function() {
        object_test(Max, "max");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([ 0,-1, 2,-3, 4, -5, 6,-7]);
            i2.cell = new Float32Array([-1,-2, 3, 5,-8,-13,21,34]);
            
            it("ar-mode", function() {
                var instance = timbre("max", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([0,-1,3,5,4,-5,21,34])
                );
            });
            it("kr", function() {
                var instance = timbre("max", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([0,0,0,0,0,0,0,0])
                );
            });
        });
    });
}
