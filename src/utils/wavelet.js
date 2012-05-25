/**
 * utils/wavelet
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

utils.wavb = function(src) {
    var lis, i, imax, j, k, x;
    lis = new Float32Array(1024);
    for (i = k = 0, imax = src.length/2; i < imax; ++i) {
        x = parseInt(src.substr(i * 2, 2), 16);
        x = (x & 0x80) ? (x - 256) / 128.0 : x / 127.0;
        for (j = 1024 / imax; j--; ) {
            lis[k++] = x;
        }
    }
    return lis;
};

// __END__
