/**
 * Delta: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Delta = (function() {
    var Delta = function() {
        initialize.apply(this, arguments);
    }, $this = Delta.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this._ = {};
        this._.x = 0;
        this.args = timbre.fn.valist.call(this, _args);    
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var tmp, x, i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;

            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            x    = _.x;
            
            if (_.ar) {
                tmp = timbre.fn.sumargsAR(this, args, seq_id);
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (tmp[i] - x) * mul + add;
                    x = tmp[i];
                }
                _.x = x;
            } else {
                tmp = timbre.fn.sumargsKR(this, args, seq_id);
                _.x = tmp;
                tmp = (tmp - x) * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = tmp;
                }
            }
        }
        return cell;
    };
    
    return Delta;
}());
timbre.fn.register("delta", Delta);

// __END__
if (module.parent && !module.parent.parent) {
    describe("delta", function() {
        object_test(Delta, "delta");
    });
}
