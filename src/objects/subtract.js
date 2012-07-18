/**
 * Subtract
 * v 0. 3. 7: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Subtract = (function() {
    var Subtract = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Subtract, {
        base: "ar-kr"
    });
    
    var initialize = function(_args) {
        this.args = _args.map(timbre);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
            var tmp, i, imax, j, jmax;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var args = this.args.slice(0);
            var mul = _.mul, add = _.add;

            if (args.length > 0) {
                if (_.ar) { // ar-mode
                    tmp = args[0].seq(seq_id);
                    for (j = jmax = cell.length; j--; ) {
                        cell[j] = tmp[j];
                    }
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp = args[i].seq(seq_id);
                        for (j = jmax; j--; ) cell[j] -= tmp[j];
                    }
                    for (j = jmax; j--; ) {
                        cell[j] = cell[j] * mul + add;
                    }
                } else {    // kr-mode
                    tmp = args[0].seq(seq_id)[0];
                    for (i = 1, imax = args.length; i < imax; ++i) {
                        tmp -= args[i].seq(seq_id)[0];
                    }
                    tmp = tmp * mul + add;
                    for (j = cell.length; j--; ) cell[j] = tmp;
                }
            } else {        // none args
                for (i = cell.length; i--; ) cell[i] = add;
            }
        }
        return cell;
    };
    
    return Subtract;
}());
timbre.fn.register("-", Subtract);

// __END__
if (module.parent && !module.parent.parent) {
    describe("subtract", function() {
        object_test(Subtract, "-");
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([ 0,-1, 2,-3, 4, -5, 6,-7]);
            i2.cell = new Float32Array([-1,-2, 3, 5,-8,-13,21,34]);
            it("ar-mode", function() {
                var instance = T("-", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([1,1,-1,-8,12,8,-15,-41])
                );
            });
            it("kr-mode", function() {
                var instance = T("-", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([1,1,1,1,1,1,1,1])
                );
            });
        });
    });
}
