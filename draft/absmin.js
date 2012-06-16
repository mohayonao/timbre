/**
 * AbsMin: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var AbsMin = (function() {
    var AbsMin = function() {
        initialize.apply(this, arguments);
    }, $this = AbsMin.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");

    var initialize = function(_args) {
        this._ = {};
        this._.sign = new Int8Array(timbre.cellsize);
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, sign;
        var mul, add;
        var tmp, x, i, imin, j, jmin;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);

            mul  = _.mul;
            add  = _.add;
            jmin = timbre.cellsize;
            sign = _.sign;
            
            if (_.ar) {
                if (args.length > 0) {
                    tmp  = args[0].seq(seq_id);
                    for (j = jmin; j--; ) {
                        x = tmp[j];
                        if (x < 0) {
                            cell[j] = -x;
                            sign[j] = -1; 
                        } else {
                            cell[j] =  x;
                            sign[j] = +1; 
                        }
                    }
                    for (i = 1, imin = args.length; i < imin; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmin; j--; ) {
                            x = tmp[j];
                            if (x < 0) {
                                if (cell[j] > -x) {
                                    cell[j] = -x;
                                    sign[j] = -1;
                                }
                            } else {
                                if (cell[j] > x) {
                                    cell[j] =  x;
                                    sign[j] = +1;
                                }
                            }
                        }
                    }
                    for (j = jmin; j--; ) {
                        cell[j] *= sign[j];
                    }
                } else {
                    for (j = jmin; j--; ) {
                        cell[j] = 0;
                    }
                }
                for (j = jmin; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            } else {
                if (args.length > 0) {
                    x = args[0].seq(seq_id)[0];
                    if (x < 0) {
                        x = -x;
                        sign[0] = -1; 
                    } else {
                        sign[0] = +1; 
                    }
                    
                    for (i = 1, imin = args.length; i < imin; ++i) {
                        tmp = args[i].seq(seq_id)[0];
                        if (tmp < 0) {
                            if (x > -tmp) {
                                x = -tmp;
                                sign[0] = -1;
                            }
                        } else {
                            if (x > tmp) {
                                x = tmp;
                                sign[0] = +1;
                            }
                        }
                    }
                    x = x * sign[0];
                } else {
                    x = 0;
                }
                x = x * mul + add;
                for (j = jmin; j--; ) {
                    cell[j] = x;
                }
            }
        }
        return cell;
    };
    
    return AbsMin;
}());
timbre.fn.register("absmin", AbsMin);

// __END__
if (module.parent && !module.parent.parent) {
    describe("absmin", function() {
        object_test(AbsMin, "absmin");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([ 0,-1, 2,-3, 4, -5, 6,-7]);
            i2.cell = new Float32Array([-1,-2, 3, 5,-8,-13,21,34]);
            
            it("ar-mode", function() {
                var instance = timbre("absmin", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([0,-1,2,-3,4,-5,6,-7])
                );
            });
            it("kr", function() {
                var instance = timbre("absmin", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([0,0,0,0,0,0,0,0])
                );
            });
        });
    });
}
