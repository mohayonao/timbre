/**
 * timbre/operators
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__
var Add = (function() {
    var Add = function() {
        initialize.apply(this, arguments);
    }, $this = Add.prototype;

    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    $this._ar_only = true;
    
    $this.seq = function(seq_id) {
        var args, cell;
        var tmp, i, j, jmax;
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }        
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    return Add;
}());
timbre.fn.register("+", Add);

var Multiply = (function() {
    var Multiply = function() {
        initialize.apply(this, arguments);
    }, $this = Multiply.prototype;

    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    $this._ar_only = true;
    
    $this.seq = function(seq_id) {
        var args, cell;
        var tmp, i, j, jmax;
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = 1;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] *= tmp[j];
                }
            }        
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    return Multiply;
}());
timbre.fn.register("*", Multiply);

// __END__

describe("+", function() {
    var instance = timbre("+", 10, 20, 30);
    object_test(Add, instance);
    describe("#clone()", function() {
        it("should have same values", function() {
            var _ = timbre(instance);
            _.args.should.eql(instance.args);
        });
    });
    describe("#seq()", function() {
        var _ = instance.seq(0);
        _.should.eql(timbre(10 + 20 + 30).seq(0));
    });
});

describe("*", function() {
    var instance = timbre("*", 10, 20, 30);
    object_test(Multiply, instance);
    describe("#clone()", function() {
        it("should have same values", function() {
            timbre(instance).args.should.eql(instance.args);
        });
    });
    describe("#seq()", function() {
        instance.seq(0).should.eql(timbre(10 * 20 * 30).seq(0));
    });
});
