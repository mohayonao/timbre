/**
 * NotEql: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var NotEql = (function() {
    var NotEql = function() {
        initialize.apply(this, arguments);
    }, $this = NotEql.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this._ = {};
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var base, tmp, x, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;

            if (args.length > 0) {
                if (_.ar) {
                    base = args[0].seq(seq_id);
                    for (j = jmax = cell.length; j--; ) {
                        cell[j] = 1;
                    }
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) {
                            if (base[j] === tmp[j]) cell[j] = 0;
                        }
                    }
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                } else {
                    x    = 1;
                    base = args[0].seq(seq_id)[0];
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id)[0];
                        if (base === tmp) x = 0;
                    }
                    x = x * mul + add;
                    for (j = cell.length; j--; ) {
                        cell[j] = x;
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
    
    return NotEql;
}());
timbre.fn.register("!=", NotEql);

// __END__
if (module.parent && !module.parent.parent) {
    describe("lessthan", function() {
        object_test(NotEql, "!=");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell"), i3 = T("cell");
            i1.cell = new Float32Array([0,0,1,1,2,2,1,1]);
            i2.cell = new Float32Array([1,2,0,2,0,1,1,2]);
            i3.cell = new Float32Array([2,1,2,0,1,0,1,2]);
            it("ar-mode", function() {
                var instance = T("!=", i1, i2, i3);
                instance.seq(0).should.eql(
                    new Float32Array([1,1,1,1,1,1,0,1])
                );
            });
            it("kr-mode", function() {
                var instance = T("!=", i1, i2, i3).kr();
                instance.seq(0).should.eql(
                    new Float32Array([1,1,1,1,1,1,1,1])
                );
            });
        });
    });
}
