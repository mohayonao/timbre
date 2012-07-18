/**
 * WavDecoder
 * Decode wav file and play it
 * v 0. 1. 0: first version
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var WavDecoder = (function() {
    var WavDecoder = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(WavDecoder, {
        base: "ar-only",
        properties: {
            src: {
                set: function(val) {
                    if (typeof val === "string") {
                        if (this._.src !== val) {
                            this._.src = val;
                            this._.isloaded = false;
                        }
                    }
                },
                get: function() { return this._.src; }
            },
            loop: {
                set: function(val) { this._.loop = !!val; },
                get: function() { return this._.loop; }
            },
            reversed: {
                set: function(val) {
                    var _ = this._;
                    _.reversed = !!val;
                    if (_.reversed && _.phase === 0) {
                        _.phase = Math.max(0, _.buffer.length - 1);
                    }
                },
                get: function() { return this._.reversed; }
            },
            isLoaded: {
                get: function() { return this._.isloaded; }
            },
            duration: {
                get: function() { return this._.duration; }
            },
            currentTime: {
                set: function(val) {
                    if (typeof val === "number") {
                        if (0 <= val && val <= this._.duration) {
                            this._.phase = (val / 1000) * this._.samplerate;
                        }
                    }
                },
                get: function() { return (this._.phase / this._.samplerate) * 1000; }
            }
        } // properties
    });
    
    
    var initialize = function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        _.src  = (typeof _args[i] === "string" ) ? _args[i++] : "";
        _.loop = (typeof _args[i] === "boolean") ? _args[i++] : false;
        
        _.loaded_src = undefined;
        _.buffer     = new Int16Array(0);
        _.samplerate = 0;
        _.duration   = 0;
        _.phaseStep  = 0;
        _.phase      = 0;
        _.reversed   = false;
    };
    
    $this.clone = function(deep) {
        var newone, _ = this._;
        newone = timbre("wav");
        newone._.src  = _.src;
        newone._.loop = _.loop;
        newone._.reversed = _.reversed;
        newone._.isloaded = _.isloaded;
        newone._.loaded_src = _.loaded_src;
        newone._.buffer     = _.buffer;
        newone._.samplerate = _.samplerate;
        newone._.duration   = _.duration;
        newone._.phaseStep  = _.phaseStep;
        newone._.phase = 0;
        return timbre.fn.copyBaseArguments(this, newone, deep);
    };
    
    $this.slice = function(begin, end) {
        var newone, _ = this._, tmp, reversed;
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
            reversed = !reversed;
        }
        newone = timbre("wav");
        newone._.src  = _.src;
        newone._.loop = _.loop;
        newone._.reversed = _.reversed;
        newone._.isloaded = _.isloaded;
        newone._.loaded_src = _.loaded_src;
        newone._.buffer     = _.buffer.subarray(begin, end);
        newone._.samplerate = _.samplerate;
        newone._.duration   = (end - begin / _.samplerate) * 1000;
        newone._.phaseStep  = _.phaseStep;
        newone._.phase = (reversed) ? Math.max(0, newone._.buffer.length - 1) : 0;
        return timbre.fn.copyBaseArguments(this, newone);
    };
    
    var send = function(type, result, callback) {
        if (type === "loadedmetadata") {
            timbre.fn.doEvent(this, "loadedmetadata", [result]);
        } else if (type === "loadeddata") {
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
            timbre.fn.doEvent(this, "loadeddata", [result]);
        } else if (type === "error") {
            if (typeof callback === "function") {
                callback.call(this, "error");
            } else if (typeof callback === "object") {
                console.log("wav.load: error.");
            }
            timbre.fn.doEvent(this, "error");
        }
    };
    
    $this.load = function(callback) {
        var self = this, _ = this._;
        var worker, src, m, buffer, samplerate;        
        if (_.loaded_src === _.src) {
            if (_.samplerate === 0) {
                send.call(this, "error", {}, callback);
            } else {
                send.call(this, "loadedmetadata",
                          {samplerate:_.samplerate,
                           buffer    :_.buffer}, callback);    
                send.call(this, "loadeddata",
                          {samplerate:_.samplerate,
                           buffer    :_.buffer}, callback);    
            }
        } else if (_.src !== "") {
            timbre.fn.doEvent(this, "loading");
            if (timbre.platform === "web" && timbre._.workerpath) {
                src = timbre.utils.relpath2rootpath(_.src);
                worker = new Worker(timbre._.workerpath);
                worker.onmessage = function(e) {
                    var data = e.data;
                    switch (data.result) {
                    case "metadata":
                        buffer     = new Int16Array(data.bufferSize);
                        samplerate = data.samplerate;
                        _.buffer     = buffer;
                        _.samplerate = samplerate;
                        send.call(self, "loadedmetadata",
                                  {samplerate:_.samplerate,
                                   buffer    :_.buffer}, callback);    
                        break;
                    case "data":
                        buffer.set(data.array, data.offset);
                        break;
                    case "ended":
                        _.isloaded   = true;
                        _.loaded_src = _.src;
                        _.duration   = (buffer.length / samplerate) * 1000;
                        _.phaseStep  = samplerate / timbre.samplerate;
                        if (_.reversed) {
                            _.phase = Math.max(0, newone._.buffer.length - 1);
                        } else {
                            _.phase = 0;    
                        }
                        send.call(self, "loadeddata",
                                  {samplerate:samplerate,
                                   buffer    :buffer}, callback);
                        break;
                    default:
                        send.call(self, "error", {}, callback);
                        break;
                    }
                };
                worker.postMessage({action:"wav.decode", src:src});
            } else {
                timbre.utils.binary.load(_.src, function(binary) {
                    timbre.utils.wav.decode(binary, function(res) {
                        if (res.err) {
                            _.loaded_src = undefined;
                            _.buffer     = new Int16Array(0);
                            _.samplerate = 0;
                            _.duration   = 0;
                            _.phaseStep  = 0;
                            _.phase = 0;
                            send.call(self, "error", {}, callback);
                        } else {
                            _.isloaded   = true;
                            _.loaded_src = _.src;
                            _.buffer     = res.buffer;
                            _.samplerate = res.samplerate;
                            _.duration   = (res.buffer.length / res.samplerate) * 1000;
                            _.phaseStep  = res.samplerate / timbre.samplerate;
                            if (_.reversed) {
                                _.phase = Math.max(0, newone._.buffer.length - 1);
                            } else {
                                _.phase = 0;
                            }
                            send.call(self, "loadedmetadata",
                                      {samplerate:_.samplerate,
                                       buffer    :_.buffer}, callback);    
                            send.call(self, "loadeddata",
                                      { samplerate:_.samplerate,
                                        buffer    :_.buffer }, callback);
                        }
                    });
                });
            }
        } else {
            send.call(this, {}, callback);
        }
        this._.isloaded = false;
        return this;
    };
    
    $this.bang = function() {
        this._.phase = 0;
        timbre.fn.doEvent(this, "bang");
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var cell, mul, add;
        var buffer, phase, phaseStep;
        var index, delta, x0, x1;
        var i, imax;
        
        if (!_.ison) return timbre._.none;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            mul    = _.mul;
            add    = _.add;
            buffer = _.buffer;
            phaseStep = _.phaseStep;
            
            if (_.reversed) {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    index = _.phase|0;
                    delta = _.phase - index;
                    
                    x0 = (buffer[index - 1] || 0) / 32768;
                    x1 = (buffer[index    ] || 0) / 32768;
                    cell[i] = ((1.0 - delta) * x0 + (delta * x1)) * mul + add;
                    
                    _.phase -= phaseStep;
                    if (_.phase < 0) {
                        if (_.loop) {
                            _.phase = Math.max(0, _.buffer.length - 1);
                            timbre.fn.doEvent(this, "looped");
                        } else {
                            timbre.fn.doEvent(this, "ended");
                        }
                    }
                }
            } else {
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    index = _.phase|0;
                    delta = _.phase - index;
                    
                    x0 = (buffer[index    ] || 0) / 32768;
                    x1 = (buffer[index + 1] || 0) / 32768;
                    cell[i] = ((1.0 - delta) * x0 + (delta * x1)) * mul + add;
                    
                    _.phase += phaseStep;
                    if (_.phase >= buffer.length) {
                        if (_.loop) {
                            _.phase = 0;
                            timbre.fn.doEvent(this, "looped");
                        } else {
                            timbre.fn.doEvent(this, "ended");
                        }
                    }
                }
            }
        }
        return cell;
    };
    
    return WavDecoder;
}());
timbre.fn.register("wav", WavDecoder);

// __END__
if (module.parent && !module.parent.parent) {
    describe("wav", function() {
        object_test(WavDecoder, "wav");
    });
}
