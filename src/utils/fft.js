/**
 * utils/fft
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

var FFT = (function() {
    var FFT = function() {
        initialize.apply(this, arguments);
    }, $this = FFT.prototype;
    
    var FFT_PARAMS = {
        get: function(n) {
            return FFT_PARAMS[n] || (function() {
                var bitrev = (function() {
                    var x, i, j, k, n2;
                    x = new Int16Array(n);
                    n2 = n >> 1;
                    i = j = 0;
                    for (;;) {
                        x[i] = j;
                        if (++i >= n) break;
                        k = n2;
                        while (k <= j) { j -= k; k >>= 1; }
                        j += k;
                    }
                    return x;
                }());
                var i, k = Math.floor(Math.log(n) / Math.LN2);
                var sintable = new Float32Array((1<<k)-1);
                var costable = new Float32Array((1<<k)-1);
                var PI2 = Math.PI * 2;
                
                for (i = sintable.length; i--; ) {
                    sintable[i] = Math.sin(PI2 * (i / n));
                    costable[i] = Math.cos(PI2 * (i / n));
                }
                return FFT_PARAMS[n] = {
                    bitrev: bitrev, sintable:sintable, costable:costable
                };
            }());
        }
    };
    
    var initialize = function(n) {
        n = (typeof n === "number") ? n : 512;
        n = 1 << Math.ceil(Math.log(n) * Math.LOG2E);
        
        this.length = n;
        this.buffer = new Float32Array(n);
        this.real   = new Float32Array(n);
        this.imag   = new Float32Array(n);
        this._real  = new Float32Array(n);
        this._imag  = new Float32Array(n);
        
        var params = FFT_PARAMS.get(n);
        this._bitrev   = params.bitrev;
        this._sintable = params.sintable;
        this._costable = params.costable;
    };
    
    $this.forward = function(_buffer) {
        var buffer, real, imag, bitrev, sintable, costable;
        var i, j, n, k, k2, h, d, c, s, ik, dx, dy;
        
        buffer = this.buffer;
        real   = this.real;
        imag   = this.imag;
        bitrev = this._bitrev;
        sintable = this._sintable;
        costable = this._costable;
        n = buffer.length;
        
        for (i = n; i--; ) {
            buffer[i] = _buffer[i];
            real[i]   = _buffer[bitrev[i]];
            imag[i]   = 0.0;
        }
        
        for (k = 1; k < n; k = k2) {
            h = 0; k2 = k + k; d = n / k2;
            for (j = 0; j < k; j++) {
                c = costable[h];
                s = sintable[h];
                for (i = j; i < n; i += k2) {
                    ik = i + k;
                    dx = s * imag[ik] + c * real[ik];
                    dy = c * imag[ik] - s * real[ik];
                    real[ik] = real[i] - dx; real[i] += dx;
                    imag[ik] = imag[i] - dy; imag[i] += dy;
                }
                h += d;
            }
        }
        return {real:real, imag:imag};
    };
    
    $this.inverse = function(_real, _imag) {
        var buffer, real, imag, bitrev, sintable, costable;
        var i, j, n, k, k2, h, d, c, s, ik, dx, dy, t;
        
        buffer = this.buffer;
        real   = this._real;
        imag   = this._imag;
        bitrev = this._bitrev;
        sintable = this._sintable;
        costable = this._costable;
        n = buffer.length;
        
        for (i = n; i--; ) {
            j = bitrev[i];
            real[i] = +_real[j];
            imag[i] = -_imag[j];
        }
        
        for (k = 1; k < n; k = k2) {
            h = 0; k2 = k + k; d = n / k2;
            for (j = 0; j < k; j++) {
                c = costable[h];
                s = sintable[h];
                for (i = j; i < n; i += k2) {
                    ik = i + k;
                    dx = s * imag[ik] + c * real[ik];
                    dy = c * imag[ik] - s * real[ik];
                    real[ik] = real[i] - dx; real[i] += dx;
                    imag[ik] = imag[i] - dy; imag[i] += dy;
                }
                h += d;
            }
        }
        
        for (i = n; i--; ) {
            buffer[i] = real[i] / n;
        }
        return buffer;
    };
    
    return FFT;
}());
utils.FFT = FFT;


// __END__
module.exports = FFT;
if (module.parent && !module.parent.parent) {
    describe("fft", function() {
        
    });
}
