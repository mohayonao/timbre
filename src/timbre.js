/**
 *  timbre / JavaScript Library for Objective Sound Programming
 */
"use strict";

// __BEGIN__
var timbre = function() {
    return timbre.fn.init.apply(timbre, arguments);
};
timbre.VERSION    = "${VERSION}";
timbre.BUILD      = "${DATE}";
timbre.env        = "";
timbre.platform   = "";
timbre.samplerate = 44100;
timbre.channels   = 2;
timbre.cellsize   = 128;
timbre.streamsize = 1024;
timbre.verbose    = true;
timbre.dacs       = [];
timbre._sys       = null;
timbre._global    = {};


timbre.fn = (function(timbre) {
    var fn = {};

    var klasses = {};
    klasses.find = function(key) {
        if (typeof klasses[key] === "function") {
            return klasses[key];
        }
    };
    
    fn.init = function() {
        var args, key, klass, instance;
        args = Array.prototype.slice.call(arguments);
        key  = args[0];

        switch (typeof key) {
        case "string":
            klass = klasses.find(key);
            if (klass) {
                instance = new klass(args.slice(1));
            }
            break;
        }
        
        if (instance) {
            object_init.call(instance);
        }
        return instance;
    };
    
    fn.register = function(key, klass) {
        if (typeof klass === "function") {
            if (typeof key === "string") {
                klass.prototype._klass = klass;
                klass.prototype._name  = key;
                klasses[key] = klass;
            }
        }
    };
    
    fn.valist = function(_args) {
        this.args = _args;
    };
    
    fn.appendTo = function(set) {
        var i;
        if ((i = set.indexOf(this)) === -1) {
            set.push(this);
        }
    };
    
    fn.removeFrom = function(set) {
        var i;
        if ((i = set.indexOf(this)) != -1) {
            set.splice(i, 1);
        }
    };
    
    var object_init = function() {
        
    };
    
    return fn;
}(timbre));


var SoundSystem = (function() {
    var SoundSystem = function() {
        initialize.apply(this, arguments);
    }, $this = SoundSystem.prototype;
    
    var initialize = function(streamsize, channels) {
        streamsize = streamsize || timbre.streamsize;
        channels   = channels   || timbre.channels;
        channels   = (channels === 1) ? 1 : 2;
        
        this.streamsize = streamsize;
        this.channels   = channels;
        this.L = new Float32Array(streamsize);
        this.R = new Float32Array(streamsize);

        this._impl = null;
        this._cell = new Float32Array(timbre.cellsize);
        this._cellsize = timbre.cellsize;
        this._seq_id = 0;
        
    };

    $this.bind = function(PlayerKlass) {
        this._impl = new PlayerKlass(this);
    };

    $this.on = function() {
        if (this._impl) this._impl.on();
    };
    
    $this.off = function() {
        if (this._impl) this._impl.off();
    };
    
    $this.process = function() {
        var cell, L, R;
        var seq_id, dacs, dac;
        var i, imax, j, jmax, k, kmax, n, nmax;
        var saved_i, tmpL, tmpR, amp, x;
        
        cell = this._cell;
        L = this.L;
        R = this.R;
        dacs = timbre.dacs;
        seq_id = this._seq_id;
        
        imax = L.length;
        jmax = dacs.length;        
        kmax = this._cellsize;
        nmax = this.streamsize / kmax;
        saved_i = 0;
        amp     = 1.0;
        
        // clear
        for (i = imax; i--; ) {
            L[i] = R[i] = 0.0;
        }
        
        // signal process
        for (n = nmax; n--; ) {
            ++seq_id;
            for (j = dacs.length; j--; ) {
                dac = dacs[j];
                dac.seq(seq_id);
                tmpL = dac.L;
                tmpR = dac.R;
                for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                    L[i] += tmpL[k];
                    R[i] += tmpR[k];
                    cell[k] = tmpL[k] + tmpR[k];
                }
            }
            saved_i = i;
        }
        
        // clip
        for (i = imax = L.length; i--; ) {
            x = L[i] * amp;
            if (x < -1.0) {
                x = -1.0;
            } else if (1.0 < x) {
                x = 1.0;
            }
            L[i] = x;
            
            x = R[i] * amp;
            if (x < -1.0) {
                x = -1.0;
            } else if (1.0 < x) {
                x = 1.0;
            }
            R[i] = x;
        }
        
        for (k = kmax; k--; ) {
            cell[k] *= 0.5;
        }
        
        this._seq_id = seq_id;
    };
    
    return SoundSystem;
}());
timbre._sys = new SoundSystem();

timbre.on = function() {
    timbre._sys.on();
    return timbre;
};

timbre.off = function() {
    timbre._sys.off();
    return timbre;
};

// __END__
global.T = global.timbre = timbre;
module.exports = timbre;
