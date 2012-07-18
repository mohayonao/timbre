/**
 * MathFunction
 * v 0. 3. 7: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var MathFunction = (function() {
    var MathFunction = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(MathFunction, {
        base: "ar-kr",
        properties: {
            func: {
                get: function() { return this._.func; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var p, i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string" &&
            MathFunction.Functions[_args[i]] !== undefined) {
            p = MathFunction.Functions[_args[i++]];
        } else {
            p = MathFunction.Functions["round"];
        }
        _.func = p.func;
        
        this.seq = seqs[p.args + 1];
        if (p.args === 2) {
            _.arg2 = (typeof _args[i] === "number") ? _args[i++] : 0;
        } else if (p.args === -1) {
            _.ar = false;
        }
        this.args = _args.slice(i).map(timbre);
    };
    
    var seqs = [];
    seqs[0] = function(seq_id) {
        var _ = this._;
        var args, cell;
        var value, i ;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            value = _.func * _.mul + _.add;
            for (i = timbre.cellsize; i--; ) {
                cell[i] = value;
            }
        }
        return cell;
    };
    seqs[1] = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add, func;
        var tmp, i, imax, j, jmax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            mul  = _.mul;
            add  = _.add;
            func = _.func;
            jmax = timbre.cellsize;
            if (_.ar) {
                for (j = jmax; j--; ) {
                    cell[j] = func() * mul + add;
                }
            } else {
                tmp = func() * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    seqs[2] = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add, func;
        var tmp, i, imax, j, jmax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            func = _.func;
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
                    cell[j] = func(cell[j]) * mul + add;
                }
            } else {
                tmp = 0;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp += args[i].seq(seq_id)[0];
                }
                tmp = func(tmp) * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    seqs[3] = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add, func, arg2;
        var tmp, i, imax, j, jmax;

        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            func = _.func;
            arg2 = _.arg2;
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
                    cell[j] = func(cell[j], arg2) * mul + add;
                }
            } else {
                tmp = 0;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp += args[i].seq(seq_id)[0];
                }
                tmp = func(tmp, arg2) * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    return MathFunction;
}());
timbre.fn.register("math", MathFunction);

MathFunction.Functions = {};
MathFunction.Functions["PI"]      = {func:Math.PI     , args:-1};
MathFunction.Functions["E"]       = {func:Math.E      , args:-1};
MathFunction.Functions["LN2"]     = {func:Math.LN2    , args:-1};
MathFunction.Functions["LN10"]    = {func:Math.LN10   , args:-1};
MathFunction.Functions["LOG2E"]   = {func:Math.LOG2E  , args:-1};
MathFunction.Functions["LOG10E"]  = {func:Math.LOG10E , args:-1};
MathFunction.Functions["SQRT2"]   = {func:Math.SQRT2  , args:-1};
MathFunction.Functions["SQRT1_2"] = {func:Math.SQRT1_2, args:-1};
MathFunction.Functions["random"]  = {func:Math.random , args: 0};
MathFunction.Functions["sin"]     = {func:Math.sin    , args: 1};
MathFunction.Functions["cos"]     = {func:Math.cos    , args: 1};
MathFunction.Functions["tan"]     = {func:Math.tan    , args: 1};
MathFunction.Functions["asin"]    = {func:Math.asin   , args: 1};
MathFunction.Functions["acos"]    = {func:Math.acos   , args: 1};
MathFunction.Functions["atan"]    = {func:Math.atan   , args: 1};
MathFunction.Functions["ceil"]    = {func:Math.ceil   , args: 1};
MathFunction.Functions["floor"]   = {func:Math.floor  , args: 1};
MathFunction.Functions["round"]   = {func:Math.round  , args: 1};
MathFunction.Functions["abs"]     = {func:Math.abs    , args: 1};
MathFunction.Functions["sqrt"]    = {func:Math.sqrt   , args: 1};
MathFunction.Functions["exp"]     = {func:Math.exp    , args: 1};
MathFunction.Functions["log"]     = {func:Math.log    , args: 1};
MathFunction.Functions["atan2"]   = {func:Math.atan2  , args: 2};
MathFunction.Functions["max"]     = {func:Math.max    , args: 2};
MathFunction.Functions["min"]     = {func:Math.min    , args: 2};
MathFunction.Functions["pow"]     = {func:Math.pow    , args: 2};

(function() {
    for (var k in MathFunction.Functions) {
        timbre.fn.register("math." + k, MathFunction, (function(k) {
            return function(_args) {
                return new MathFunction([k].concat(_args));
            };
        }(k)));
    }
}());

// __END__

describe("math", function() {
    object_test(MathFunction, "math");
});
