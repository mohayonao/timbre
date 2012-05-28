/**
 * timbre/audio
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

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
            this.onended = _args[i++];
        }
        
        this._.buffer = new Float32Array(0);
        this._.phase  = 0;
    },
    setPrototype: function() {
        Object.defineProperty(this, "src", {
            set: function(value) {
                if (typeof value === "string") {
                    this._.src = value;
                }            
            },
            get: function() { return this._.src; }
        });
        Object.defineProperty(this, "loop", {
            set: function(value) {
                if (typeof value === "boolean") {
                    this._.loop = value;
                }            
            },
            get: function() { return this._.loop; }
        });
        
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
                        timbre.fn.do_event(this, "ended");
                        if (_.loop) _.phase = 0;
                    }
                }
                this.seq_id = seq_id;
            }
            return cell;
        };
        
        return this;
    }
};


var WebKitAudio = (function() {
    var WebKitAudio = function() {
        AudioBasis.initialize.apply(this, arguments);
    }, $this = AudioBasis.setPrototype.call(WebKitAudio.prototype);
    
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
                timbre.fn.do_event(self, "loadedmetadata", [opts]);
                timbre.fn.do_event(self, "loadeddata", [opts]);
            };
            xhr.send();
        } else {
            opts.success = false;
            timbre.fn.do_event(self, "loadedmetadata", [opts]);
        }
        _.buffer = new Float32Array(0);
        _.phase  = 0;
        return this;
    };
    
    return WebKitAudio;
}());
timbre.fn.register("-webkit-audio", WebKitAudio);


var MozAudio = (function() {
    var MozAudio = function() {
        AudioBasis.initialize.apply(this, arguments);
    }, $this = AudioBasis.setPrototype.call(MozAudio.prototype);
    
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
                timbre.fn.do_event(self, "loadedata", [opts]);
            }, false);
            audio.load();
        }
        _.buffer = new Float32Array(0);
        _.phase  = 0;
        return this;
    };
    
    return MozAudio;
}());
timbre.fn.register("-moz-audio", MozAudio);

// __END__
