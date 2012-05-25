/**
 * worker/wav
 */
"use strict";

var timbre = require("../timbre");
var worker = { actions:{} };
// __BEGIN__

worker.actions["wav.decode"] = function(data) {
    var src;
    src = data.src;
    if (/\.wav$/.test(src)) {
        timbre.utils.binary.load(src, function(binary) {
            timbre.utils.wav.decode(binary, function(res) {
                var buf, i, array;
                if (res.err) {
                    worker.postMessage({result:undefined, err:res.err});
                } else {
                    buf = res.buffer;
                    worker.postMessage({result:"metadata", samplerate:res.samplerate,
                                        bufferSize:buf.length});
                    i = 0;
                    do {
                        array = buf.subarray(i, i + 8192);
                        worker.postMessage({result:"data", array:array, offset:i});
                        i += array.length;
                    } while (array.length);
                    worker.postMessage({result:"ended"});
                }
            });
        });
    }
};

// __END__
