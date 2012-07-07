/**
 * Modulo: 0.3.7
 * Divide signals, output the remainder
 * [ar-kr]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Modulo = (function() {
    var Modulo = function() {
        initialize.apply(this, arguments);
    }, $this = Modulo.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var tmp, x, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;

            if (args.length > 0) {
                if (_.ar) {
                    tmp = args[0].seq(seq_id);
                    for (j = jmax = cell.length; j--; ) {
                        cell[j] = tmp[j];
                    }
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            x = tmp[j];
                            if (x === 0) {
                                cell[j] = 0;
                            } else {
                                cell[j] %= x;
                            }
                        }
                    }
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                } else {
                    tmp = args[0].seq(seq_id)[0];
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        x = args[i].seq(seq_id)[0];
                        if (x === 0) {
                            tmp = 0;
                        } else {
                            tmp %= x
                        }
                    }
                    tmp = tmp * mul + add;
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
    
    return Modulo;
}());
timbre.fn.register("%", Modulo);

// __END__
if (module.parent && !module.parent.parent) {
    describe("modulo", function() {
        object_test(Modulo, "%");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([ 0,-1, 2,-3, 4, -5, 6,-7]);
            i2.cell = new Float32Array([-1,-2, 3, 5,-8,-13,21, 0]);
            it("ar-mode", function() {
                var instance = T("%", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([0,-1%-2,2%3,-3%5,4%-8,-5%-13,6%21,0])
                );
            });
            it("kr-mode", function() {
                var instance = T("%", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([0,0,0,0,0,0,0,0])
                );
            });
        });
    });
}
