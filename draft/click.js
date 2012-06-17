/**
 * Click: <draft>
 * [ar-kr]
 */
"use strict";

var timbre = require("../src/timbre");
// __BEGIN__

var Click = (function() {
    var Click = function() {
        initialize.apply(this, arguments);
    }, $this = Click.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this._.click = false;
    };
    
    $this.bang = function() {
        this._.click = true;
        timbre.fn.doEvent(this, "bang");
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, mul, add;
        var i;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            mul  = _.mul;
            add  = _.add;
            
            if (_.ar) {
                for (i = cell.length; i--; ) {
                    cell[i] = add;
                }
                if (_.click) {
                    cell[0] = mul + add;
                    _.click = false;
                }
            } else {
                if (_.click) {
                    x = mul + add;
                    _.click = false;
                } else {
                    x = add;
                }
                for (i = cell.length; i--; ) {
                    cell[i] = x;
                }
            }
        }
        return cell;
    };
    
    return Click;
}());
timbre.fn.register("click", Click);

// __END__
if (module.parent && !module.parent.parent) {
    describe("click", function() {
        object_test(Click, "click");
    });
}
