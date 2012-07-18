/**
 * Pong
 * Variable range signal folding
 * v 0. 3. 6: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Pong = (function() {
    var Pong = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Pong, {
        base: "ar-kr"
    });
    
    
    var initialize = function(_args) {
        this.args = _args.map(timbre);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, mul, add;
        var x, y, i;
        
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
                    
                    if (x < -1.0) {
                        x = -x - 1.0;
                        y = x >> 1;
                        x = (y & 1) ? +1 - (x-(y<<1)) : -1 + (x-(y<<1));
                    } else if (1.0 < x) {
                        x = +x - 1.0;
                        y = x >> 1;
                        x = (y & 1) ? -1 + (x-(y<<1)) : +1 - (x-(y<<1));
                    }
                    
                    cell[i] = x * mul + add;
                }
            } else {
                x = timbre.fn.sumargsKR(this, args, seq_id);
                
                if (x < -1.0) {
                    x = -x - 1.0;
                    y = x >> 1;
                    x = (y & 1) ? +1 - (x-(y<<1)) : -1 + (x-(y<<1));
                } else if (1.0 < x) {
                    x = +x - 1.0;
                    y = x >> 1;
                    x = (y & 1) ? -1 + (x-(y<<1)) : +1 - (x-(y<<1));
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
