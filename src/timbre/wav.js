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
            if (typeof value === "string") this._.src = value;
        },
        get: function() { return this._.src; }
    });
    Object.defineProperty($this, "loop", {
        set: function(value) {
            if (typeof value === "boolean") this._.loop = value;
        },
        get: function() { return this._.loop; }
    });
    Object.defineProperty($this, "duration", {
        get: function() { return this._.duration; }
    });
    Object.defineProperty($this, "currentTime", {
        set: function(value) {
            if (typeof value === "number") {
                if (0 <= value && value <= this._.duration) {
                    this._.phase = (value / 1000) * this._.samplerate;
                }
            }
        },
        get: function() { return (this._.phase / this._.samplerate) * 1000; }
    });
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        if (typeof _args[i] === "string") {
            _.src = _args[i++];
        } else {
            _.src = "";
        }
        if (typeof _args[i] === "boolean") {
            _.loop = _args[i++];
        } else {
            _.loop = false;
        }
        
        _.loaded_src = undefined;
        _.buffer     = new Int16Array(0);
        _.samplerate = 0;
        _.duration   = 0;
        _.phaseStep  = 0;
        _.phase = 0;
    };
    timbre.fn.set_ar_only($this);
    
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
        var self = this, _ = this._;
        var worker, src, m, buffer, samplerate;        
        if (_.loaded_src === _.src) {
            send.call(this, {samplerate:_.samplerate, buffer:_.buffer}, callback);
        } else if (_.src !== "") {
            timbre.fn.do_event(this, "loading");
            if (timbre.platform === "web" && timbre.workerpath) {
                src = _.src;
                if ((m = /^(?:\.)(.*)$/.exec(src)) !== null) {
                    src = location.pathname;
                    src = src.substr(0, src.lastIndexOf("/"));
                    src += m[1];
                }
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
                        _.loaded_src = _.src;
                        _.buffer     = buffer;
                        _.samplerate = samplerate;
                        _.duration   = (buffer.length / samplerate) * 1000;
                        _.phaseStep  = samplerate / timbre.samplerate;
                        _.phase = 0;
                        send.call(self, {samplerate:samplerate, buffer:buffer}, callback);
                        break;
                    default:
                        send.call(self, data, callback);
                        break;
                    }
                };
                worker.postMessage({action:"wav.decode", src:src});
            } else {
                timbre.utils.binary.load(_.src, function(binary) {
                    timbre.utils.wav.decode(binary, function(res) {
                        if (res) {
                            _.loaded_src = _.src;
                            _.buffer     = res.buffer;
                            _.samplerate = res.samplerate;
                            _.duration   = (res.buffer.length / res.samplerate) * 1000;
                            _.phaseStep  = res.samplerate / timbre.samplerate;
                            _.phase = 0;
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

    $this.clone = function() {
        var _ = this._;
        var newOne;
        newOne = timbre("wav");
        newOne._.src        = _.src;
        newOne._.loop       = _.loop;
        newOne._.loaded_src = _.loaded_src;
        newOne._.buffer     = _.buffer;
        newOne._.samplerate = _.samplerate;
        newOne._.duration   = _.duration;
        newOne._.phaseStep  = _.phaseStep;
        newOne._.phase = 0;
        newOne._.mul   = _.mul;
        newOne._.add   = _.add;
        return newOne;
    };
    
    $this.slice = function(begin, end) {
        var _ = this._;
        var newOne, tmp;
        if (typeof begin === "number") {
            begin = (begin / 1000) * _.samplerate;
        } else begin = 0;
        if (typeof end   === "number") {
            end   = (end   / 1000) * _.samplerate;
        } else end = _.buffer.length;
        if (begin > end) {
            tmp   = begin;
            begin = end;
            end   = tmp;
        }
        newOne = timbre("wav");
        newOne._.src        = _.src;
        newOne._.loop       = _.loop;
        newOne._.loaded_src = _.loaded_src;
        newOne._.buffer     = _.buffer.subarray(begin, end);
        newOne._.samplerate = _.samplerate;
        newOne._.duration   = (end - begin / _.samplerate) * 1000;
        newOne._.phaseStep  = _.phaseStep;
        newOne._.phase = 0;
        newOne._.mul   = _.mul;
        newOne._.add   = _.add;
        return newOne;
    };
    
    $this.bang = function() {
        this._.phase = 0;
        timbre.fn.do_event(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, mul, add;
        var buffer, phase, phaseStep;
        var index, delta, x0, x1;
        var i, imax;
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            mul    = _.mul;
            add    = _.add;
            buffer = _.buffer;
            phase  = _.phase;
            phaseStep = _.phaseStep;
            for (i = 0, imax = cell.length; i < imax; ++i) {
                index = phase|0;
                delta = phase - index;
                
                x0 = (buffer[index    ] || 0) / 32768;
                x1 = (buffer[index + 1] || 0) / 32768;
                cell[i] = ((1.0 - delta) * x0 + (delta * x1)) * mul + add;
                
                phase += phaseStep;
                if (buffer.length <= phase) {
                    if (_.loop) {
                        phase = 0;
                        timbre.fn.do_event(this, "looped");
                    } else {
                        timbre.fn.do_event(this, "ended");
                    }
                }
            }
            _.phase = phase;
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return Wav;
}());
timbre.fn.register("wav", Wav);

// __END__

