/**
 * timbre/audio
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Audio: <draft>
 * Store audio samples
 * [ar-only]
 */
var AudioBasis = {
    initialize: function(_args) {
        var i, _;
        
        this._ = _ = {};
        
        i = 0;
        _.src  = (typeof _args[i] === "string" ) ? _args[i++] : "";
        _.loop = (typeof _args[i] === "boolean") ? _args[i++] : false;
        
        if (typeof _args[i] === "number") {
            _.mul = _args[i++];
        }
        if (typeof _args[i] === "number") {
            _.add = _args[i++];
        }
        if (typeof _args[i] === "function") {
            if (_.loop) {
                this.onlooped = _args[i++];
            } else {
                this.onended  = _args[i++];
            }
        }
        
        _.buffer   = new Float32Array(0);
        _.phase    = 0;
        _.isLoaded = false;
    },
    setPrototype: function() {
        Object.defineProperty(this, "src", {
            set: function(value) {
                if (typeof value === "string") {
                    if (this._.src !== value) {
                        this._.src = value;
                        this._.isLoaded = false;
                    }
                }
            },
            get: function() { return this._.src; }
        });
        // TODO: isLoop
        Object.defineProperty(this, "loop", {
            set: function(value) {
                if (typeof value === "boolean") {
                    this._.loop = value;
                }            
            },
            get: function() { return this._.loop; }
        });
        Object.defineProperty(this, "isLoaded", {
            get: function() { return this._.isLoaded; }
        });
        
        this.clone = function(deep) {
            var klassname, newone, _ = this._;
            klassname = Object.getPrototypeOf(this)._.klassname;
            newone = timbre(klassname, _.src, _.loop, _.mul, _.add);
            newone._.isLoaded = _.isLoaded;
            newone._.buffer   = _.buffer;
            return newone;
        };
        
        this.bang = function() {
            this._.phase = 0;
            timbre.fn.do_event(this, "bang");
            return this;
        };
        
        this.seq = function(seq_id) {
            var _ = this._;
            var cell, buffer, mul, add;
            var i, imax;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                buffer = _.buffer;
                mul    = _.mul
                add    = _.add;
                for (i = 0, imax = cell.length; i < imax; ++i) {
                    cell[i] = (buffer[_.phase++]||0) * mul + add;
                    if (buffer.length === _.phase) {
                        if (_.loop) {
                            _.phase = 0;
                            timbre.fn.do_event(this, "looped");
                        } else {
                            timbre.fn.do_event(this, "ended");
                        }
                    }
                }
                this.seq_id = seq_id;
            }
            return cell;
        };
        
        return this;
    }
};


/**
 * WebKitAudio: <draft>
 * Store audio samples (Web Audio API)
 * [ar-only]
 */
var WebKitAudio = (function() {
    var WebKitAudio = function() {
        AudioBasis.initialize.apply(this, arguments);
    }, $this = AudioBasis.setPrototype.call(WebKitAudio.prototype);
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    $this.load = function() {
        var self = this, _ = this._;
        var ctx, xhr, opts;
        
        ctx  = new webkitAudioContext();
        xhr  = new XMLHttpRequest();
        opts = { success:true, buffer:null, samplerate:ctx.sampleRate };
        
        if (_.src !== "") {
            xhr.open("GET", _.src, true);
            xhr.responseType = "arraybuffer";
            xhr.onload = function() {
                _.buffer = ctx.createBuffer(xhr.response, true).getChannelData(0);
                opts.buffer = _.buffer;
                _.isLoaded = true;
                timbre.fn.do_event(self, "loadedmetadata", [opts]);
                timbre.fn.do_event(self, "loadeddata", [opts]);
            };
            xhr.send();
        } else {
            opts.success = false;
            timbre.fn.do_event(self, "loadedmetadata", [opts]);
        }
        _.isLoaded = false;
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
        AudioBasis.initialize.apply(this, arguments);
    }, $this = AudioBasis.setPrototype.call(MozAudio.prototype);
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    $this.load = function(callback) {
        var self = this, _ = this._;
        var audio, output, buffer_index, istep, opts;
        var callback_count = 1;
        
        opts = { success:true, buffer:null, samplerate:0 };
        
        if (_.src !== "") {
            audio = new Audio(_.src);
            audio.loop = false;
            audio.addEventListener("loadedmetadata", function(e) {
                audio.volume = 0.0;
                _.buffer = new Float32Array((audio.duration * audio.mozSampleRate)|0);
                buffer_index = 0;
                istep = audio.mozSampleRate / timbre.samplerate;
                audio.play();
                opts.buffer = _.buffer;
                opts.samplerate = audio.mozSampleRate;
            }, false);
            audio.addEventListener("MozAudioAvailable", function(e) {
                var samples, buffer, i, imax;
                samples = e.frameBuffer;
                buffer  = _.buffer;
                for (i = 0, imax = samples.length; i < imax; i += istep) {
                    buffer[buffer_index++] = samples[i|0];
                }
                callback_count -= 1;
                if (callback_count === 0) {
                    timbre.fn.do_event(self, "loadedmetadata", [opts]);
                }
            }, false);
            audio.addEventListener("ended", function(e) {
                _.isLoaded = true;
                timbre.fn.do_event(self, "loadedata", [opts]);
            }, false);
            audio.load();
        }
        _.isLoaded = false;
        _.buffer   = new Float32Array(0);
        _.phase    = 0;
        return this;
    };
    
    return MozAudio;
}());
timbre.fn.register("-moz-audio", MozAudio);

// __END__
