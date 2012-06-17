/**
 * SoftClip: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var SoftClip = (function() {
    var SoftClip = function() {
        initialize.apply(this, arguments);
    }, $this = SoftClip.prototype;
    
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
                    if (x < -0.5) {
                        x = (-x - 0.25) / x;
                    } else if (0.5 < x) {
                        x = (+x - 0.25) / x;
                    }
                    cell[i] = x * mul + add;
                }
            } else {
                x = timbre.fn.sumargsKR(this, args, seq_id);
                if (x < -0.5) {
                    x = (-x - 0.25) / x;
                } else if (0.5 < x) {
                    x = (+x - 0.25) / x;
                }
                x = x * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    return SoftClip;
}());
timbre.fn.register("softclip", SoftClip);

// __END__
if (module.parent && !module.parent.parent) {
    describe("softclip", function() {
        object_test(SoftClip, "softclip");
    });
}
