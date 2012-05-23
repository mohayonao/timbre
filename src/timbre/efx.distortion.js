/**
 * timbre/efx.distortion
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var EfxDistortion = (function() {
    var EfxDistortion = function() {
        initialize.apply(this, arguments);
    }, $this = EfxDistortion.prototype;
    
    Object.defineProperty($this, "pre", {
        set: function(value) {
            if (typeof value !== "object") {
                this._preGain = timbre(value);
            } else {
                this._preGain = value;
            }
        },
        get: function() { return this._preGain; }
                        
    });
    Object.defineProperty($this, "post", {
        set: function(value) {
            if (typeof value !== "object") {
                this._postGain = timbre(value);
            } else {
                this._postGain = value;
            }
        },
        get: function() { return this._postGain; }
                        
    });
    Object.defineProperty($this, "freq", {
        set: function(value) {
            if (typeof value !== "object") {
                this._lpfFreq = timbre(value);
            } else {
                this._lpfFreq = value;
            }
        },
        get: function() { return this._lpfFreq; }
                        
    });
    Object.defineProperty($this, "slope", {
        set: function(value) {
            if (typeof value !== "object") {
                this._lpfSlope = timbre(value);
            } else {
                this._lpfSlope = value;
            }
        },
        get: function() { return this._lpfSlope; }
    });
    Object.defineProperty($this, "isEnabled", {
        get: function() { return this._enabled; }
                        
    });
    
    var initialize = function(_args) {
        var i;
        
        i = 0;
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._preGain = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._preGain = timbre(_args[i++]);
        } else {
            this._preGain = timbre(-60);
        }
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._postGain = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._postGain = timbre(_args[i++]);
        } else {
            this._postGain = timbre(18);
        }
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._lpfFreq = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._lpfFreq = timbre(_args[i++]);
        } else {
            this._lpfFreq = timbre(2400);
        }
        
        if (typeof _args[i] === "object" && !_args[i]._ar) {
            this._lpfSlope = _args[i++];    
        } else if (typeof _args[i] === "number") {
            this._lpfSlope = timbre(_args[i++]);
        } else {
            this._lpfSlope = timbre(1);
        }
        
        if (typeof _args[i] === "number") {
            this._mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            this._add = _args[i++];
        }

        this._prev_preGain  = undefined;
        this._prev_postGain = undefined;
        this._prev_lpfFreq  = undefined;
        this._prev_lpfSlope = undefined;
        
        this._in1 = this._in2 = this._out1 = this._out2 = 0;
        this._a1  = this._a2  = 0;
        this._b0  = this._b1  = this._b2 = 0;
        
        this.args = timbre.fn.valist.call(this, _args.slice(i));
        this._enabled = true;
    };
    
    $this._ar = true;    
    
    var THRESHOLD = 0.0000152587890625;
    
    $this._set_params = function(preGain, postGain, lpfFreq, lpfSlope) {
        var postScale, omg, cos, sin, alp, n, ia0;
        
        postScale = Math.pow(2, -postGain / 6);
        this._preScale = Math.pow(2, -preGain / 6) * postScale;
        this._limit = postScale;
        
        if (lpfFreq) {
            omg = lpfFreq * 2 * Math.PI / timbre.samplerate;
            cos = Math.cos(omg);
            sin = Math.sin(omg);
            n = 0.34657359027997264 * lpfSlope * omg / sin;
            alp = sin * (Math.exp(n) - Math.exp(-n)) * 0.5;
            ia0 = 1 / (1 + alp);
            this._a1 = -2 * cos  * ia0;
            this._a2 = (1 - alp) * ia0;
            this._b1 = (1 - cos) * ia0;
            this._b2 = this._b0 = this._b1 * 0.5;
        }
    };

    $this.on = function() {
        this._enabled = true;
        timbre.fn.do_event(this, "on");
        return this;
    };
    
    $this.off = function() {
        this._enabled = false;
        timbre.fn.do_event(this, "off");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell, args;
        var tmp, i, imax, j, jmax;
        var preGain, postGain, lpfFreq, lpfSlope;
        var preScale, limit;
        var a1, a2, b0, b1, b2;
        var in1, in2, out1, out2;
        var input, output;
        
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            for (j = jmax = cell.length; j--; ) {
                cell[j] = 0.0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            
            // filter
            if (this._enabled) {
                preGain  = this._preGain.seq(seq_id)[0];
                postGain = this._postGain.seq(seq_id)[0];
                lpfFreq  = this._lpfFreq.seq(seq_id)[0];
                lpfSlope = this._lpfSlope.seq(seq_id)[0];
                if (preGain  !== this._prev_preGain ||
                    postGain !== this._prev_postGain ||
                    lpfFreq  !== this._prev_lpfFreq  ||
                    lpfSlope !== this._prev_lpfSlope) {
                    this._set_params(preGain, postGain, lpfFreq, lpfSlope);    
                }
                
                preScale = this._preScale;
                limit    = this._limit;
                
                if (this._lpfFreq) {
                    a1 = this._a1; a2 = this._a2;
                    b0 = this._b0; b1 = this._b1; b2 = this._b2;
                    in1  = this._in1;  in2  = this._in2;
                    out1 = this._out1; out2 = this._out2;
                    
                    if (out1 < THRESHOLD) out2 = out1 = 0;
                    
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
                        
                        cell[i] = output;
                    }
                    this._in1  = in1;  this._in2  = in2;
                    this._out1 = out1; this._out2 = out2;
                } else {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        input = cell[i] * preScale;
                        if (input > limit) {
                            input = limit;
                        } else if (input < -limit) {
                            input = -limit;
                        }
                        cell[i] = input;
                    }
                }
            }
        }
        return cell;
    };

    return EfxDistortion;
}());
timbre.fn.register("efx.dist", EfxDistortion);

// __END__