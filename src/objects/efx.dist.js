/**
 * EfxDistortion
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxDistortion = (function() {
    var EfxDistortion = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(EfxDistortion, {
        base: "ar-only",
        properties: {
            pre: {
                set: function(val) {
                    this._.preGain = timbre(val);
                },
                get: function() { return this._.preGain; }
            },
            post: {
                set: function(val) {
                    this._.postGain = timbre(val);
                },
                get: function() { return this._.postGain; }
            },
            freq: {
                set: function(val) {
                    this._.lpfFreq = timbre(val);
                },
                get: function() { return this._.lpfFreq; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.preGain = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.preGain = timbre(_args[i++]);
        } else {
            _.preGain = timbre(-60);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.postGain = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.postGain = timbre(_args[i++]);
        } else {
            _.postGain = timbre(18);
        }
        
        if (typeof _args[i] === "object" && _args[i].isKr) {
            _.lpfFreq = _args[i++];    
        } else if (typeof _args[i] === "number") {
            _.lpfFreq = timbre(_args[i++]);
        } else {
            _.lpfFreq = timbre(2400);
        }
        
        this.args = _args.slice(i).map(timbre);
        
        _.prev_preGain  = undefined;
        _.prev_postGain = undefined;
        _.prev_lpfFreq  = undefined;
        _.in1 = _.in2 = _.out1 = _.out2 = 0;
        _.a1  = _.a2  = 0;
        _.b0  = _.b1  = _.b2 = 0;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("efx.dist", _.preGain, _.postGain, _.lpfFreq);
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, args, mul, add;
        var preGain, postGain, preScale, postScale, lpfFreq, limit;
        var a1, a2, b0, b1, b2, in1, in2, out1, out2;
        var omg, cos, sin, alp, n, ia0;
        var input, output;
        var i, imax;        
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            args = this.args.slice(0);
            mul = _.mul;
            add = _.add;
            
            cell = timbre.fn.sumargsAR(this, args, seq_id);
            
            if (_.ison) {
                preGain  = _.preGain.seq(seq_id)[0];
                postGain = _.postGain.seq(seq_id)[0];
                lpfFreq  = _.lpfFreq.seq(seq_id)[0];
                if (preGain  !== _.prev_preGain ||
                    postGain !== _.prev_postGain ||
                    lpfFreq  !== _.prev_lpfFreq) {
                    
                    postScale  = Math.pow(2, -postGain / 6);
                    _.preScale = Math.pow(2, -preGain / 6) * postScale;
                    _.limit = postScale;
                    
                    if (lpfFreq) {
                        omg = lpfFreq * 2 * Math.PI / timbre.samplerate;
                        cos = Math.cos(omg);
                        sin = Math.sin(omg);
                        n = 0.34657359027997264 * omg / sin;
                        alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
                        ia0 = 1 / (1 + alp);
                        _.a1 = -2 * cos  * ia0;
                        _.a2 = (1 - alp) * ia0;
                        _.b1 = (1 - cos) * ia0;
                        _.b2 = _.b0 = _.b1 * 0.5;
                    }
                }
                
                preScale = _.preScale;
                limit    = _.limit;
                
                if (_.lpfFreq) {
                    a1 = _.a1; a2 = _.a2;
                    b0 = _.b0; b1 = _.b1; b2 = _.b2;
                    in1  = _.in1;  in2  = _.in2;
                    out1 = _.out1; out2 = _.out2;
                    
                    if (out1 < 0.0000152587890625) out2 = out1 = 0;
                    
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        input = cell[i] * preScale;
                        if (input > limit) {
                            input = limit;
                        } else if (input < -limit) {
                            input = -limit;
                        }
                        
                        output = b0 * input + b1 * in1 + b2 * in2 - a1 * out1 - a2 * out2;
                        
                        if (output > 1.0) {
                            output = 1.0;
                        } else if (output < -1.0) {
                            output = -1.0;
                        }
                        
                        in2  = in1;
                        in1  = input;
                        out2 = out1;
                        out1 = output;
                        
                        cell[i] = output * mul + add;
                    }
                    _.in1  = in1;  _.in2  = in2;
                    _.out1 = out1; _.out2 = out2;
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        input = cell[i] * preScale;
                        if (input > limit) {
                            input = limit;
                        } else if (input < -limit) {
                            input = -limit;
                        }
                        cell[i] = input * mul + add;
                    }
                }
            } else {
                for (i = cell.length; i--; ) {
                    cell[i] = cell[i] * mul + add;
                }
            }
        }
        return cell;
    };
    
    return EfxDistortion;
}());
timbre.fn.register("efx.dist", EfxDistortion);

// __END__
if (module.parent && !module.parent.parent) {
    describe("efx.dist", function() {
        object_test(EfxDistortion, "efx.dist");
    });
}
