/**
 * AudioDecoder: 0.1.0
 * Store audio samples
 * [ar-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var AudioDecoder = {
    initialize: function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        _.src  = (typeof _args[i] === "string" ) ? _args[i++] : "";
        _.loop = (typeof _args[i] === "boolean") ? _args[i++] : false;
        
        if (typeof _args[i] === "function") {
            if (_.loop) {
                this.onlooped = _args[i++];
            } else {
                this.onended  = _args[i++];
            }
        }
        
        _.buffer   = new Float32Array(0);
        _.duration = 0;
        _.phase    = 0;
        _.reversed = false;
        _.isloaded = false;
    },
    setPrototype: function() {
        Object.defineProperty(this, "src", {
            set: function(value) {
                if (typeof value === "string") {
                    if (this._.src !== value) {
                        this._.src = value;
                        this._.isloaded = false;
                    }
                }
            },
            get: function() { return this._.src; }
        });
        Object.defineProperty(this, "loop", {
            set: function(value) { this._.loop = !!value; },
            get: function() { return this._.loop; }
        });
        Object.defineProperty(this, "reversed", {
            set: function(value) {
                var _ = this._;
                _.reversed = !!value;
                if (_.reversed && _.phase === 0) {
                    _.phase = Math.max(0, _.buffer.length - 1);
                }
            },
            get: function() { return this._.reversed; }
        });
        Object.defineProperty(this, "isLoaded", {
            get: function() { return this._.isloaded; }
        });
        Object.defineProperty(this, "duration", {
            get: function() { return this._.duration; }
        });
        Object.defineProperty(this, "currentTime", {
            set: function(value) {
                var _ = this._;
                if (typeof value === "number") {
                    if (0 <= value && value <= _.duration) {
                        _.phase = ((value / 1000) * timbre.samplerate)|0;
                    }
                }
            },
            get: function() { return (this._.phase / timbre.samplerate) * 1000; }
        });
        
        this.clone = function(deep) {
            var klassname, newone, _ = this._;
            klassname = this._.proto._.klassname;
            newone = timbre(klassname, _.src, _.loop);
            newone._.reversed = _.reversed;
            newone._.isloaded = _.isloaded;
            newone._.buffer   = _.buffer;
            newone._.duration = _.duration;
            newone._.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
            return timbre.fn.copyBaseArguments(this, newone, deep);
        };
        
        this.slice = function(begin, end) {
            var klassname, newone, _ = this._, tmp, reversed;
            klassname = this._.proto._.klassname;
            
            reversed = _.reversed;
            if (typeof begin === "number") {
                begin = (begin / 1000) * timbre.samplerate;
            } else begin = 0;
            if (typeof end   === "number") {
                end   = (end   / 1000) * timbre.samplerate;
            } else end = _.buffer.length;
            if (begin > end) {
                tmp   = begin;
                begin = end;
                end   = tmp;
                reversed = !reversed;
            }
            
            newone = timbre(klassname);
            newone._.loop = _.loop;
            newone._.reversed = reversed;
            newone._.buffer   = _.buffer.subarray(begin, end);
            newone._.duration = (end - begin / timbre.samplerate) * 1000;
            newone._.phase = (reversed) ? Math.max(0, newone._.buffer.length - 1) : 0;
            return timbre.fn.copyBaseArguments(this, newone);
        };
        
        this.bang = function() {
            var _ = this._;
            _.phase = (_.reversed) ? Math.max(0, _.buffer.length - 1) : 0;
            timbre.fn.doEvent(this, "bang");
            return this;
        };
        
        this.seq = function(seq_id) {
            var _ = this._;
            var cell, buffer, mul, add;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                buffer = _.buffer;
                mul    = _.mul
                add    = _.add;
                if (_.reversed) {
                    for (i = 0, imax = cell.length; i < imax; ++i) {
                        cell[i] = (buffer[_.phase--]||0) * mul + add;
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
                        cell[i] = (buffer[_.phase++]||0) * mul + add;
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
        
        return this;
    }
};


/**
 * WebKitAudio: 0.1.0
 * Store audio samples (Web Audio API)
 * [ar-only]
 */
var WebKitAudio = (function() {
    var WebKitAudio = function() {
        AudioDecoder.initialize.apply(this, arguments);
    }, $this = AudioDecoder.setPrototype.call(WebKitAudio.prototype);
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    $this.load = function() {
        var self = this, _ = this._;
        var ctx, xhr, opts;
        
        ctx  = new webkitAudioContext();
        xhr  = new XMLHttpRequest();
        opts = { buffer:null, samplerate:ctx.sampleRate };
        
        if (_.src !== "") {
            xhr.open("GET", _.src, true);
            xhr.responseType = "arraybuffer";
            xhr.onreadystatechange = function(event) {
                if (xhr.readyState === 4) {
                    if (xhr.status !== 200) {
                        timbre.fn.doEvent(self, "error", [xhr]);
                    }
                }
            };
            xhr.onload = function() {
                _.buffer = ctx.createBuffer(xhr.response, true).getChannelData(0);
                _.duration  = _.buffer.length / timbre.samplerate * 1000;
                opts.buffer = _.buffer;
                
                timbre.fn.doEvent(self, "loadedmetadata", [opts]);
                _.isloaded = true;
                timbre.fn.doEvent(self, "loadeddata", [opts]);
            };
            xhr.send();
        } else {
            timbre.fn.doEvent(self, "error", [xhr]);
        }
        _.isloaded = false;
        _.buffer   = new Float32Array(0);
        _.phase    = 0;
        return this;
    };
    
    return WebKitAudio;
}());
timbre.fn.register("-webkit-audio", WebKitAudio);


/**
 * MozAudio: <draft>
 * Store audio samples (Audio Data API)
 * [ar-only]
 */
var MozAudio = (function() {
    var MozAudio = function() {
        AudioDecoder.initialize.apply(this, arguments);
    }, $this = AudioDecoder.setPrototype.call(MozAudio.prototype);
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    $this.load = function(callback) {
        var self = this, _ = this._;
        var audio, output, buffer_index, istep, opts;
        
        opts = { buffer:null, samplerate:0 };
        
        if (_.src !== "") {
            audio = new Audio(_.src);
            audio.loop = false;
            audio.addEventListener("error", function(e) {
                timbre.fn.doEvent(self, "error", [e]);
            }, false);
            audio.addEventListener("loadedmetadata", function(e) {
                audio.volume = 0.0;
                _.buffer = new Float32Array((audio.duration * audio.mozSampleRate)|0);
                _.duration = audio.duration * 1000;
                buffer_index = 0;
                istep = audio.mozSampleRate / timbre.samplerate;
                audio.play();
                opts.buffer = _.buffer;
                opts.samplerate = audio.mozSampleRate;
                timbre.fn.doEvent(self, "loadedmetadata", [opts]);
            }, false);
            audio.addEventListener("MozAudioAvailable", function(e) {
                var samples, buffer, i, imax;
                samples = e.frameBuffer;
                buffer  = _.buffer;
                for (i = 0, imax = samples.length; i < imax; i += istep) {
                    buffer[buffer_index++] = samples[i|0];
                }
            }, false);
            audio.addEventListener("ended", function(e) {
                _.isloaded = true;
                timbre.fn.doEvent(self, "loadeddata", [opts]);
            }, false);
            audio.load();
        }
        _.isloaded = false;
        _.buffer   = new Float32Array(0);
        _.phase    = 0;
        return this;
    };
    
    return MozAudio;
}());
timbre.fn.register("-moz-audio", MozAudio);

// __END__
if (module.parent && !module.parent.parent) {
}
