/**
 * Add: 0.1.0
 * Add signals
 * [ar-kr]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Add = (function() {
    var Add = function() {
        initialize.apply(this, arguments);
    }, $this = Add.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("+"), deep);
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

// __END__
if (module.parent && !module.parent.parent) {
    describe("+", function() {
        object_test(Add, "+");
    });
}
