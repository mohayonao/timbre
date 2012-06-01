/**
 * timbre/operators
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Add: 0.0.0
 * Add signals
 * [ar-kr]
 */
var Add = (function() {
    var Add = function() {
        initialize.apply(this, arguments);
    }, $this = Add.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.clone = function(deep) {
        var newone;
        newone = timbre("+");
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
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
                    cell[j] = 0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            } else {
                tmp = 0;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp += args[i].seq(seq_id)[0];
                }
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
            
        }
        return cell;
    };
    
    return Add;
}());
timbre.fn.register("+", Add);

/**
 * Multiply: 0.0.0
 * Multiply signals
 * [ar-kr]
 */
var Multiply = (function() {
    var Multiply = function() {
        initialize.apply(this, arguments);
    }, $this = Multiply.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.clone = function(deep) {
        var newone;
        newone = timbre("*");
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
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

describe("+", function() {
    object_test(Add, "+");
});

describe("*", function() {
    object_test(Multiply, "*");
});
