/**
 * utils/wavelet
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

utils.wavb = function(src) {
    var lis = new Float32Array(1024);
    var n = src.length >> 1;
    if (n ===  2 || n ===  4 || n ===  8 || 
        n === 16 || n === 32 || n === 64) {
        for (var i = 0, k = 0; i < n; ++i) {
            var x = parseInt(src.substr(i * 2, 2), 16);
            x = (x & 0x80) ? (x-256) / 128.0 : x / 127.0;
            for (var j = 1024 / n; j--; ) lis[k++] = x;
        }
    }
    return lis;
};

utils.wavc = function(src) {
    var lis = new Float32Array(1024);
    if (src.length === 8) {
        var color = parseInt(src, 16);
        var bar   = new Float32Array(8);
        var PI2   = Math.PI * 2, sin = Math.sin, abs = Math.abs;
        var i, j;
        
        bar[0] = 1;
        for (i = 0; i < 7; ++i, color >>= 4)
            bar[i+1] = (color & 0x0f) / 16;
        
        var maxx = 0, absx;
        for (i = 0; i < 8; ++i) {
            var x = 0, dx = (i+1) / 1024;
            for (j = 0; j < 1024; ++j) {
                lis[j] += sin(PI2 * x) * bar[i];
                x += dx;
                if (maxx < (absx = abs(lis[j]))) maxx = absx;
            }
        }
        if (maxx > 0) for (i = 1024; i--; ) lis[i] /= maxx;
    }
    return lis;
};

// __END__
