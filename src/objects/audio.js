/**
 * AudioDecoder
 * Store audio samples
 * v 0. 1. 0: first version
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
            set: function(val) {
                if (typeof val === "string") {
                    if (this._.src !== val) {
                        this._.src = val;
                        this._.isloaded = false;
                    }
                } else if (timbre.platform === "web" && val instanceof File) {
                    this._.src = val;
                    this._.isloaded = false;
                }
            },
            get: function() { return this._.src; }
        });
        Object.defineProperty(this, "loop", {
            set: function(val) { this._.loop = !!val; },
            get: function() { return this._.loop; }
        });
        Object.defineProperty(this, "reversed", {
            set: function(val) {
                var _ = this._;
                _.reversed = !!val;
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
            set: function(val) {
                var _ = this._;
                if (typeof val === "number") {
                    if (0 <= val && val <= _.duration) {
                        _.phase = ((val / 1000) * timbre.samplerate)|0;
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
        
        this.getAudioSrc = function() {
            var _ = this._;
            var items, m, saved, i, imax;
            if (timbre.platform === "web") {
                saved = "";
                items = _.src.split(/,/).map(function(x) { return x.trim(); });
                for (i = 0, imax = items.length; i < imax; ++i) {
                    m = /^(.*\.)(aac|mp3|ogg|wav)$/i.exec(saved + items[i]);
                    if (m) {
                        if ((new Audio("")).canPlayType("audio/" + m[2])) {
                            return m[0];
                        }
                        if (saved === "") saved = m[1];
                    }
                }
            }
            return "";
        };
        
        return this;
    }
};


/**
 * WebKitAudio
 * Store audio samples (WebAudioAPI)
 * v 0. 1. 0: first version
 */
var WebKitAudio = (function() {
    var WebKitAudio = function() {
        AudioDecoder.initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(WebKitAudio, {
        base: ["ar-only", AudioDecoder.setPrototype]
    });
    
    
    $this.load = function() {
        var self = this, _ = this._;
        var src, ctx, xhr, opts;
        var reader;
        
        ctx  = new webkitAudioContext();
        xhr  = new XMLHttpRequest();
        opts = { buffer:null, samplerate:ctx.sampleRate };
        
        if (_.src instanceof File) {
            reader = new FileReader();
            reader.onload = function(e) {
                var buffer;
                
                try {
                    buffer = ctx.createBuffer(e.target.result, true);
                } catch (e) {
                    buffer = null;
                }
                
                if (buffer !== null) {
                    _.buffer    = buffer.getChannelData(0);
                    _.duration  = _.buffer.length / timbre.samplerate * 1000;
                    opts.buffer = _.buffer;
                    
                    timbre.fn.doEvent(self, "loadedmetadata", [opts]);
                    _.isloaded = true;
                    timbre.fn.doEvent(self, "loadeddata", [opts]);
                } else {
                    timbre.fn.doEvent(self, "error", [e]);
                }
            };
            reader.readAsArrayBuffer(_.src);
        } else {
            src = this.getAudioSrc(_.src);
            if (src !== "") {
                xhr.open("GET", src, true);
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
        }
        return this;
    };
    
    return WebKitAudio;
}());
timbre.fn.register("-webkit-audio", WebKitAudio);


/**
 * MozAudio
 * Store audio samples (AudioDataAPI)
 * v 0. 1. 0: first version
 */
var MozAudio = (function() {
    var MozAudio = function() {
        AudioDecoder.initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(MozAudio, {
        base: ["ar-only", AudioDecoder.setPrototype]
    });
    
    
    var loadAudio = function(audio, opts) {
        var self = this, _ = this._;
        var output, buffer_index, istep;
        
        var loadFunc = function(e) {
            var samples, buffer, i, imax;
            try {
                samples = e.frameBuffer;
                buffer  = _.buffer;
                for (i = 0, imax = samples.length; i < imax; i += istep) {
                    buffer[buffer_index++] = samples[i|0];
                }
                audio.removeEventListener("MozAudioAvailable", loadFunc);
                audio.addEventListener("MozAudioAvailable", function(e) {
                    var samples, buffer, i, imax;
                    samples = e.frameBuffer;
                    buffer  = _.buffer;
                    for (i = 0, imax = samples.length; i < imax; i += istep) {
                        buffer[buffer_index++] = samples[i|0];
                    }
                }, false);
            } catch (e) {
                audio.removeEventListener("MozAudioAvailable", loadFunc);
                audio.pause();
                timbre.fn.doEvent(self, "error", [e]);
            }
        };
        
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
        audio.addEventListener("MozAudioAvailable", loadFunc, false);
        audio.addEventListener("ended", function(e) {
            _.isloaded = true;
            timbre.fn.doEvent(self, "loadeddata", [opts]);
        }, false);
        audio.load();
    };
    
    $this.load = function(callback) {
        var self = this, _ = this._;
        var src, reader, opts;
        
        opts = { buffer:null, samplerate:0 };
        
        if (_.src instanceof File) {
            reader = new FileReader();
            reader.onload = function(e) {
                var audio, m;
                if ((m = /^data:(.*?);/.exec(e.target.result)) !== null) {
                    if ((new Audio("")).canPlayType(m[1])) {
                        audio = new Audio(e.target.result);
                        loadAudio.call(self, audio, opts);
                    } else {
                        timbre.fn.doEvent(self, "error", ["cannot play: '" + m[1] + "'"]);
                    }
                } else {
                    timbre.fn.doEvent(self, "error", ["file error"]);
                }
            };
            reader.readAsDataURL(_.src);
        } else {        
            src = this.getAudioSrc(_.src);
            if (src !== "") {
                loadAudio.call(this, new Audio(src), opts);
            }
            _.isloaded = false;
            _.buffer   = new Float32Array(0);
            _.phase    = 0;
        }
        return this;
    };
    
    return MozAudio;
}());
timbre.fn.register("-moz-audio", MozAudio);

// __END__
if (module.parent && !module.parent.parent) {
}
