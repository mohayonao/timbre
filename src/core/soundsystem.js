/**
 * SoundSystem: 0.1.0
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var SoundSystem = (function() {
    var SoundSystem = function() {
        initialize.apply(this, arguments);
    }, $this = SoundSystem.prototype;
    
    var initialize = function() {
        this.streamsize = timbre.streamsize;
        this.channels   = timbre.channels;
        this.L = new Float32Array(timbre.streamsize);
        this.R = new Float32Array(timbre.streamsize);
        this.cell = new Float32Array(timbre.cellsize);
        this.seq_id = 0;
        
        this._ = {};
        this._.impl = null;
        this._.ison = false;
        this._.cellsize = timbre.cellsize;
    };
    
    $this.bind = function(PlayerKlass) {
        this._.impl = new PlayerKlass(this);
    };
    
    $this.setup = function() {
        if (this._.impl) this._.impl.setup();
        this.streamsize = timbre.streamsize;
        this.channels   = timbre.channels;
        if (timbre.streamsize !== this.L.length) {
            this.L = new Float32Array(timbre.streamsize);
            this.R = new Float32Array(timbre.streamsize);
        }
        if (timbre.cellsize !== this.cell.length) {
            this.cell = new Float32Array(timbre.cellsize);
            this._.cellsize = timbre.cellsize;
        }
        if (timbre.samplerate === 0) timbre.samplerate = 44100;
    };
    
    $this.on = function() {
        if (this._.impl) {
            this._.ison = true;
            this._.impl.on();
        }
    };
    
    $this.off = function() {
        if (this._.impl) {
            this._.impl.off();
            this._.ison = false;
        }
    };
    
    $this.process = function() {
        var cell, L, R;
        var seq_id, dacs, dac, timers, timer, listeners, listener;
        var i, imax, j, jmax, k, kmax, n, nmax;
        var saved_i, tmpL, tmpR, amp, x;
        
        cell = this.cell;
        L = this.L;
        R = this.R;
        amp = timbre._.amp;
        
        seq_id = this.seq_id;
        
        imax = L.length;
        kmax = this._.cellsize;
        nmax = this.streamsize / kmax;
        saved_i = 0;
        
        // clear
        for (i = imax; i--; ) {
            L[i] = R[i] = 0.0;
        }
        
        // signal process
        for (n = nmax; n--; ) {
            ++seq_id;
            timers = timbre.timers.slice(0);
            for (j = 0, jmax = timers.length; j < jmax; ++j) {
                if ((timer = timers[j]) !== undefined) {
                    timer.seq(seq_id);
                }
            }
            dacs = timbre.dacs.slice(0);
            for (j = 0, jmax = dacs.length; j < jmax; ++j) {
                if ((dac = dacs[j]) !== undefined) {
                    dac.seq(seq_id);
                    tmpL = dac.L;
                    tmpR = dac.R;
                    for (k = 0, i = saved_i; k < kmax; ++k, ++i) {
                        L[i] += tmpL[k];
                        R[i] += tmpR[k];
                    }
                }
            }
            saved_i = i;
            listeners = timbre.listeners.slice(0);
            for (j = 0, jmax = listeners.length; j < jmax; ++j) {
                if ((listener = listeners[j]) !== undefined) {
                    listener.seq(seq_id);
                }
            }
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
            cell[k] = L[k] + R[k];
            x = cell[k] * amp * 0.5;
            if (x < -1.0) {
                x = -1.0;
            } else if (1.0 < x) {
                x = 1.0;
            }
            cell[k] = x;
        }
        
        this.seq_id = seq_id;
    };
    
    return SoundSystem;
}());
timbre.sys = new SoundSystem();

// __END__
global.SoundSystem = SoundSystem;
