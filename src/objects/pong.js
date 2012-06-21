/**
 * Pong: 0.3.6
 * Variable range signal folding
 * [ar-kr]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Pong = (function() {
    var Pong = function() {
        initialize.apply(this, arguments);
    }, $this = Pong.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var x, i;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            
            if (_.ar) {
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                for (i = cell.length; i--; ) {
                    x = cell[i];
                    while (x < -1.0 || 1.0 < x) {
                        if (x < -1.0) {
                            x = -1.0 - (x + 1.0);
                        } else {
                            x = 1.0 - (x - 1.0);
                        }
                    }
                    cell[i] = x * mul + add;
                }
            } else {
                x = timbre.fn.sumargsKR(this, args, seq_id);
                while (x < -1.0 || 1.0 < x) {
                    if (x < -1.0) {
                        x = -1.0 - (x + 1.0);
                    } else {
                        x = 1.0 - (x - 1.0);
                    }
                }
                x = x * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    return Pong;
}());
timbre.fn.register("pong", Pong);

// __END__
if (module.parent && !module.parent.parent) {
    describe("pong", function() {
        object_test(Pong, "pong");
    });
}
