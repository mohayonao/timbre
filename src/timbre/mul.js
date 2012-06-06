/**
 * Multiply: 0.1.0
 * Multiply signals
 * [ar-kr]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Multiply = (function() {
    var Multiply = function() {
        initialize.apply(this, arguments);
    }, $this = Multiply.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("*"), deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add;
        var tmp, i, imax, j, jmax;
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            if (_.ar) {
                for (j = jmax; j--; ) {
                    cell[j] = mul;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp = args[i].cell;
                    } else {
                        tmp = args[i].seq(seq_id);
                    }
                    for (j = jmax; j--; ) {
                        cell[j] *= tmp[j];
                    }
                }
                if (add !== 0) {
                    for (j = jmax; j--; ) {
                        cell[j] += add;
                    }
                }
            } else {
                tmp = mul;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    if (args[i].seq_id === seq_id) {
                        tmp *= args[i].cell[0];
                    } else {
                        tmp *= args[i].seq(seq_id)[0];
                    }
                }
                tmp += add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    return Multiply;
}());
timbre.fn.register("*", Multiply);

// __END__

describe("*", function() {
    object_test(Multiply, "*");
});
