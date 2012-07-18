/**
 * Aux
 * v12.07.18: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Aux = (function() {
    var Aux = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Aux, {
        base: "ar-only",
        properties: {
            list: {
                set: function(val) {
                    if (val instanceof Array) {
                        this._.list = val;
                        compile.call(this);
                    }
                },
                get: function() { return this._.list; }
            }
        }
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.list = [];
        _.workcell = new Float32Array(timbre.cellsize);
        _.stub = { seq: function() { return _.workcell; } };
        
        this.args = _args.map(timbre);
    };

    var compile = function() {
        var _ = this._;
        var list = _.list, stub = _.stub;
        for (var i = list.length; i--; ) {
            list[i].args.removeAll().push(stub);
        }
    };
    
    $this.seq = function(seq_id) {
        var tmp, _ = this._;
        
        var cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var args = this.args.slice(0);
            var workcell = _.workcell;
            var list = _.list;
            var mul = _.mul, add = _.add;
            var i, imax;
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            workcell.set(cell);
            var xx = workcell[0];
            for (i = 0, imax = list.length; i < imax; ++i) {
                workcell.set(list[i].seq(seq_id));
            }
            
            for (i = cell.length; i--; ) {
                cell[i] = workcell[i] * mul + add;
            }
        }
        return cell;
    };
    
    return Aux;
}());
timbre.fn.register("aux", Aux);

// __END__
if (module.parent && !module.parent.parent) {

}
