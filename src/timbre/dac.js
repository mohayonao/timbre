/**
 * timbre/dac
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Dac = (function() {
    var Dac = function() {
        initialize.apply(this, arguments);
    }, $this = Dac.prototype;

    var initialize = function(_args) {
        this.L = new Float32Array(timbre.cellsize);
        this.R = new Float32Array(timbre.cellsize);
        this._panL = this._panR = Math.sin(Math.PI * 0.25);
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this.on = function() {
        timbre.dacs.append(this);
    };
    
    $this.off = function() {
        timbre.dacs.remove(this);
    };
    
    $this.seq = function(seq_id) {
        var args, cell, L, R;
        var amp, panL, panR;
        var tmp, i, j, jmax;

        cell = this._cell;
        if (seq_id !== this._seq_id) {
            args = this.args;
            L = this.L;
            R = this.R;
            amp = this._amp;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = L[j] = R[j] = 0;
            }
            for (i = args.length; i--; ) {
                tmp = args[i].seq(seq_id);
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j] * amp;
                    L[j] += tmp[j] * panL;
                    R[j] += tmp[j] * panR;
                }                
            }
            this._seq_id = seq_id;
        }
        return cell;
    };    
    
    return Dac;
}());
timbre.fn.register("dac", Dac)

// __END__
