/**
 * timbre/wav
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Wav = (function() {
    var Wav = function() {
        initialize.apply(this, arguments);
    }, $this = Wav.prototype;
    
    Object.defineProperty($this, "src", {
        set: function(value) {
            if (typeof value === "string") this._src = value;
        },
        get: function() { return this._src; }
    });
    Object.defineProperty($this, "loop", {
        set: function(value) {
            if (typeof value === "boolean") this._loop = value;
        },
        get: function() { return this._loop; }
    });
    Object.defineProperty($this, "duration", {
        get: function() { return this._duration; }
    });
    Object.defineProperty($this, "currentTime", {
        set: function(value) {
            if (typeof value === "number") {
                if (0 <= value && value <= this._duration) {
                    this._phase = (value / 1000) * this._samplerate;    
                }
            }
        },
        get: function() { return (this._phase / this._samplerate) * 1000; }
    });
    
    var initialize = function(_args) {
        var i;

        i = 0;
        if (typeof _args[i] === "string") {
            this._src = _args[i++];
        } else {
            this._src = "";
        }
        if (typeof _args[i] === "boolean") {
            this._loop = _args[i++];
        } else {
            this._loop = false;
        }
        
        this._loaded_src = undefined;
        this._buffer     = new Int16Array(0);
        this._samplerate = 0;
        this._duration   = 0;
        this._phaseStep  = 0;
        this._phase = 0;
    };
    
    var send = function(result, callback) {
        if (typeof callback === "function") {
            callback.call(this, result);
        } else if (typeof callback === "object") {
            if (result.buffer) {
                callback.self       = this;
                callback.samplerate = result.samplerate;
                callback.duration   = (result.buffer.length / samplerate) * 1000;
                callback.buffer     = result.buffer;
                console.log("wav.load: done.");
            }
        }
        timbre.fn.do_event(this, "loadend", [result]);
    };
    
    $this.load = function(callback) {
        var self = this;
        var worker, buffer, samplerate;        
        if (this._loaded_src === this._src) {
            send.call(this, {samplerate:this._samplerate, buffer:this._buffer}, callback);
        } else if (this._src !== "") {
            timbre.fn.do_event(this, "loading");
            if (timbre.platform === "web" && timbre.workerpath) {
                worker = new Worker(timbre.workerpath);
                worker.onmessage = function(e) {
                    var data = e.data;
                    switch (data.result) {
                    case "metadata":
                        buffer     = new Int16Array(data.bufferSize);
                        samplerate = data.samplerate;
                        break;
                    case "data":
                        buffer.set(data.array, data.offset);
                        break;
                    case "ended":
                        self._loaded_src = self._src;
                        self._buffer     = buffer;
                        self._samplerate = samplerate;
                        self._duration   = (buffer.length / samplerate) * 1000;
                        self._phaseStep  = samplerate / timbre.samplerate;
                        self._phase = 0;
                        send.call(self, {samplerate:samplerate, buffer:buffer}, callback);
                        break;
                    default:
                        send.call(self, data, callback);
                        break;
                    }
                };
                worker.postMessage({action:"wav.decode", src:this._src});
            } else {
                timbre.utils.binary.load(this._src, function(binary) {
                    timbre.utils.wav.decode(binary, function(res) {
                        if (res) {
                            self._loaded_src = self._src;
                            self._buffer     = res.buffer;
                            self._samplerate = res.samplerate;
                            self._duration   = (res.buffer.length / samplerate) * 1000;
                            self._phaseStep  = res.samplerate / timbre.samplerate;
                            self._phase = 0;
                            send.call(self, { samplerate:res.samplerate,
                                              buffer:res.buffer }, callback);
                        }
                    });
                });
            }
        } else {
            send.call(this, {}, callback);
        }
        return this;
    };
    
    $this.bang = function() {
        this._phase = 0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var cell, mul, add;
        var buffer, phase, phaseStep;
        var index, delta, x0, x1;
        var i, imax;
        cell = this._cell;
        if (seq_id !== this._seq_id) {
            mul    = this._mul;
            add    = this._add;
            buffer = this._buffer;
            phase  = this._phase;
            phaseStep = this._phaseStep;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                index = phase|0;
                delta = phase - index;
                
                x0 = (buffer[index    ] || 0) / 32768;
                x1 = (buffer[index + 1] || 0) / 32768;
                cell[i] = (1.0 - delta) * x0 + (delta * x1) * mul + add;
                
                phase += phaseStep;
                if (buffer.length <= phase) {
                    if (this._loop) {
                        phase = 0;
                        timbre.fn.do_event(this, "looped");
                    } else {
                        timbre.fn.do_event(this, "ended");
                    }
                }
            }
            this._phase = phase;
            this._seq_id = seq_id;
        }
        return cell;
    };
    
    return Wav;
}());
timbre.fn.register("wav", Wav);

// __END__

