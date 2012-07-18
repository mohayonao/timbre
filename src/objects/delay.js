/**
 * Delay
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Delay = (function() {
    var Delay = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(Delay, {
        base: "ar-kr",
        properties: {
            delay: {
                set: function(val) {
                    if (typeof val === "number") this._.delayTime = val;
                },
                get: function() { return this._.delayTime; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var bits, i, _;
        
        this._ = _ = {};
        bits = Math.ceil(Math.log(timbre.samplerate * 5) * Math.LOG2E)
        
        _.buffer = new Float32Array(1 << bits);
        _.buffer_mask = (1 << bits) - 1;
        _.pointerWrite = 0;
        _.pointerRead  = 0;
        
        i = 0;
        if (typeof _args[i] === "number") {
            _.delayTime = _args[i++];
        }
        
        var offset = _.delayTime * timbre.samplerate / 1000;
        _.pointerWrite = (_.pointerRead + offset) & _.buffer_mask;
        
        this.args = _args.slice(i).map(timbre);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, tmp, mul, add;
        var buffer, buffer_mask, pointerRead, pointerWrite;
        var i, imax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            
            buffer = _.buffer;
            buffer_mask  = _.buffer_mask;
            pointerWrite = _.pointerWrite;
            pointerRead  = _.pointerRead;
            
            tmp = timbre.fn.sumargsAR(this, args, seq_id);
            for (i = 0, imax = tmp.length; i < imax; ++i) {
                buffer[pointerWrite] = tmp[i];
                cell[i] = buffer[pointerRead] * mul + add;
                pointerWrite = (pointerWrite + 1) & buffer_mask;
                pointerRead  = (pointerRead  + 1) & buffer_mask;
            }
            _.pointerWrite = pointerWrite;
            _.pointerRead  = pointerRead;
            
            if (!_.ar) {
                tmp = cell[0];
                for (i = max; i--; ) {
                    cell[i] = tmp;
                }
            }
        }
        return cell;
    };
    
    return Delay;
}());
timbre.fn.register("delay", Delay);

// __END__
if (module.parent && !module.parent.parent) {
    describe("delay", function() {
        object_test(Delay, "delay");
    });
}
