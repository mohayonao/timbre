/**
 * Add: 0.3.2
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
        var cell, args, mul, add;
        var tmp, i;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            
            if (_.ar) {
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            } else {
                tmp = timbre.fn.sumargsKR(this, args, seq_id);
                
                tmp = tmp * mul + add;
                for (i = cell.length; i--; ) {
                    cell[i] = tmp;
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
        describe("#seq()", function() {
            var i1 = T("cell"), i2 = T("cell");
            i1.cell = new Float32Array([ 0,-1, 2,-3, 4, -5, 6,-7]);
            i2.cell = new Float32Array([-1,-2, 3, 5,-8,-13,21,34]);
            it("ar-mode", function() {
                var instance = T("+", i1, i2);
                instance.seq(0).should.eql(
                    new Float32Array([-1,-3, 5,2,-4,-18,27,27])
                );
            });
            it("kr-mode", function() {
                var instance = T("+", i1, i2).kr();
                instance.seq(0).should.eql(
                    new Float32Array([-1,-1,-1,-1,-1,-1,-1,-1])
                );
            });
        });
    });
}
