/**
 * utils/wav
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

(function(wav) {
    var send = function(samplerate, buffer, callback, err) {
        if (typeof callback === "function") {
            callback({samplerate:samplerate, buffer:buffer, err:err});
        } else if (typeof callback === "object") {
            callback.samplerate = samplerate;
            callback.buffer     = buffer;
            callback.err        = err;
        }
    };
    
    wav.decode = function(bytes, callback) {
        var buffer;
        var i, imax;
        var l1, l2;
        var byteLength, linearPCM, channels, samplerate, dataSpeed;
        var blockSize , bitSize, duration, data;
        
        if (! bytes instanceof ArrayBuffer) {
            send(0, null, callback,
                 "TypeError: wave.decode is expected an ArrayBuffer");
            return;
        }
        
        bytes = new Uint8Array(bytes);
        if (bytes[0] !== 0x52 || bytes[1] !== 0x49 ||
            bytes[2] !== 0x46 || bytes[3] !== 0x46) { // 'RIFF'
                send(0, null, callback,
                     "HeaderError: not exists 'RIFF'");
            return;
        }
        
        l1 = bytes[4] + (bytes[5]<<8) + (bytes[6]<<16) + (bytes[7]<<24);
        if (l1 + 8 !== bytes.length) {
            send(0, null, callback,
                 "HeaderError: invalid data size");
            return;
        }
        
        if (bytes[ 8] !== 0x57 || bytes[ 9] !== 0x41 ||
            bytes[10] !== 0x56 || bytes[11] !== 0x45) { // 'WAVE'
                send(0, null, callback,
                     "HeaderError: not exists 'WAVE'");
            return;
        }
        
        if (bytes[12] !== 0x66 || bytes[13] !== 0x6D ||
            bytes[14] !== 0x74 || bytes[15] !== 0x20) { // 'fmt '
                send(0, null, callback,
                     "HeaderError: not exists 'fmt '");
            return;
        }
        
        byteLength = bytes[16] + (bytes[17]<<8) + (bytes[18]<<16) + (bytes[19]<<24);
        linearPCM  = bytes[20] + (bytes[21]<<8);
        channels   = bytes[22] + (bytes[23]<<8);
        samplerate = bytes[24] + (bytes[25]<<8) + (bytes[26]<<16) + (bytes[27]<<24);
        dataSpeed  = bytes[28] + (bytes[29]<<8) + (bytes[30]<<16) + (bytes[31]<<24);
        blockSize  = bytes[32] + (bytes[33]<<8);
        bitSize    = bytes[34] + (bytes[35]<<8);
        
        if (bytes[36] !== 0x64 || bytes[37] !== 0x61 ||
            bytes[38] !== 0x74 || bytes[39] !== 0x61) { // 'data'
                send(0, null, callback,
                     "HeaderError: not exists 'data'");
            return;
        }
        
        l2 = bytes[40] + (bytes[41]<<8) + (bytes[42]<<16) + (bytes[43]<<24);
        duration = ((l2 / channels) >> 1) / samplerate;
        
        if (l2 > bytes.length - 44) {
            send(0, null, callback,
                 "HeaderError: not exists data");
            return;
        }
        
        buffer = new Int16Array((duration * samplerate)|0);

        if (bitSize === 8) {
            data = new Int8Array(bytes.buffer, 44);
        } else if (bitSize === 16) {
            data = new Int16Array(bytes.buffer, 44);
        } else if (bitSize === 32) {
            data = new Int32Array(bytes.buffer, 44);
        } else if (bitSize === 24) {
            data = (function() {
                var data;
                var b0, b1, b2, bb, x;
                var i, imax, j;
                data = new Int32Array((bytes.length - 44) / 3);
                j = 0;
                for (i = 44, imax = bytes.length; i < imax; ) {
                    b0 = bytes[i++] ,b1 = bytes[i++], b2 = bytes[i++];
                    bb = b0 + (b1 << 8) + (b2 << 16);
                    x = (bb & 0x800000) ? -((bb^0xFFFFFF)+1) : bb;
                    data[j++] = x;
                }
                return data;
            }());
        }
        
        if (data) {
            if (channels === 1) {
                (function() {
                    var i, amp0, amp1;
                    amp0 = 1 / ((1 << (bitSize-1))  ) * ((1<<15)  );
                    amp1 = 1 / ((1 << (bitSize-1))-1) * ((1<<15)-1);
                    for (i = buffer.length; i--; ) {
                        buffer[i] = data[i] * (data[i] < 0 ? amp0 : amp1);
                    }
                    send(samplerate, buffer, callback);
                }());
                return;
            } else if (channels === 2) {
                (function() {
                    var i, j, jmax, x, xL, xR, amp0, amp1;
                    amp0 = 1 / ((1 << (bitSize-1))  );
                    amp1 = 1 / ((1 << (bitSize-1))-1);
                    for (i = j = 0, jmax = buffer.length; j < jmax; i+=2, ++j) {
                        xL = data[i  ] * (data[i  ] < 0 ? amp0 : amp1);
                        xR = data[i+1] * (data[i+1] < 0 ? amp0 : amp1);
                        x = (xL + xR) * 0.5;
                        buffer[j] = x * ((x < 0) ? 32768 : 32767);
                    }
                    send(samplerate, buffer, callback);
                }());
                return;
            }
        }
        send(0, null, callback, "not implementation");
    };    
}( utils.wav = {} ));

// __END__
