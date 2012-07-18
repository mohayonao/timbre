/**
 * SampleAndHold
 * v 0. 3. 6: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var SampleAndHold = (function() {
    var SampleAndHold = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(SampleAndHold, {
        base: "ar-kr",
        properties: {
            sample: {
                set: function(val) {
                    if (typeof val === "number") this._.sampleMax = val|0;
                },
                get: function() { return this._.sampleMax; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};

        i = 0;
        if (typeof _args[i] === "number") {
            _.sampleMax = _args[i++]|0;
        } else {
            _.sampleMax = (timbre.samplerate / 10000)|0
        }
        _.sample = 0;
        _.hold = 0;
        
        this.args = _args.slice(i).map(timbre);
    };
    
    $this.bang = function() {
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, tmp, mul, add;
        var sample, hold;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            sample = _.sample;
            hold   = _.hold;
            mul  = _.mul;
            add  = _.add;
            
            tmp = timbre.fn.sumargsAR(this, args, seq_id);
            for (i = 0, imax = tmp.length; i < imax; ++i) {
                if (sample <= 0) {
                    hold = tmp[i];
                    sample += _.sampleMax;
                }
                cell[i] = hold * mul + add;
                --sample;
            }
            _.sample = sample;
            _.hold   = hold;
            
            if (!_.ar) {
                tmp = cell[0];
                for (i = imax; i--; ) {
                    cell[i] = tmp;
                }
            }
        }
        return cell;
    };
    
    return SampleAndHold;
}());
timbre.fn.register("s&h", SampleAndHold);

// __END__
if (module.parent && !module.parent.parent) {
    describe("s&h", function() {
        object_test(SampleAndHold, "s&h");
    });
}
