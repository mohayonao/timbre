/**
 * Add
 * Add signals
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Add = (function() {
    var Add = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Add, {
        base: "ar-kr"
    });
    
    var initialize = function(_args) {
        this.args = _args.map(timbre);
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("+"), deep);
    };
    
    $this.seq = function(seq_id) {
        var tmp, _ = this._;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var args = this.args.slice(0);
            var mul = _.mul, add = _.add;
            
            if (_.ar) { // ar-mode
                cell = timbre.fn.sumargsAR(this, args, seq_id);
                for (var i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            } else {    // kr-mode
                tmp = timbre.fn.sumargsKR(this, args, seq_id);
                tmp = tmp * mul + add;
                for (var i = cell.length; i--; ) {
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
