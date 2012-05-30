/**
 * timbre/sys
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Dac = (function() {
    /**
     * Dac: 0.1.0
     * Audio output
     * [ar-only]
     */
    var Dac = function() {
        initialize.apply(this, arguments);
    }, $this = Dac.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    Object.defineProperty($this, "dac", {
        get: function() { return this; }
    });
    Object.defineProperty($this, "pan", {
        set: function(value) {
            this._.pan = timbre(value);
        },
        get: function() { return this._.pan; }
    });
    
    var initialize = function(_args) {
        var _ = this._ = {};
        this.args = timbre.fn.valist.call(this, _args);
        this.pan = 0.5;
        this.L = new Float32Array(timbre.cellsize);
        this.R = new Float32Array(timbre.cellsize);
        _.prev_pan = undefined;
    };
    
    $this._post_init = function() {
        var i, args;
        args = this.args;
        for (i = args.length; i--; ) {
            args[i].dac = this;
        }
    };
    
    $this.clone = function(deep) {
        var newone = timbre("dac");
        newone._.pan = (deep) ? this._.pan.clone(true) : this._.pan;
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this.on = function() {
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.do_event(this, "on");
        return this;
    };
    $this.off = function() {
        this._.ison = false;
        timbre.dacs.remove(this);
        timbre.fn.do_event(this, "off");
        return this;
    };
    $this.play = function() {
        this._.ison = true;
        timbre.dacs.append(this);
        timbre.fn.do_event(this, "play");        
        return this;
    };
    $this.pause = function() {
        this._.ison = false;
        timbre.dacs.remove(this);
        timbre.fn.do_event(this, "pause");        
        return this;
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell, L, R;
        var mul, pan, panL, panR;
        var tmp, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            if (_.pan.seq_id === seq_id) {
                pan = _.pan.cell[0];
            } else {
                pan = _.pan.seq(seq_id)[0];
            }
            if (pan !== _.prev_pan) {
                _.panL = Math.cos(0.5 * Math.PI * pan);
                _.panR = Math.sin(0.5 * Math.PI * pan);
                _.prev_pan = pan;
            }
            L = this.L;
            R = this.R;
            mul  = _.mul;
            panL = _.panL * mul;
            panR = _.panR * mul;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = L[j] = R[j] = 0;
            }
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (args[i] !== undefined) {
                    if (args[i].seq_id === seq_id) {
                        tmp = args[i].cell;
                    } else {
                        tmp = args[i].seq(seq_id);
                    }
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j] * mul;
                        L[j] += tmp[j] * panL;
                        R[j] += tmp[j] * panR;
                    }
                }
            }
        }
        return cell;
    };
    
    return Dac;
}());
timbre.fn.register("dac", Dac);

timbre.fn.register("pandac", Dac, function(_args) {
    var instance = new Dac(_args.slice(1));
    instance.pan = _args[0];
    return instance;
});


var AR = (function() {
    /**
     * AR: 0.1.0
     * Convert audiorate
     * [ar-only]
     */
    var AR = function() {
        initialize.apply(this, arguments);
    }, $this = AR.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-only");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this._post_init = function() {
        $this._._play  = this.play;
        $this._._pause = this.pause;
        $this._._on    = this.on;
        $this._._off   = this.off;
        $this._._bang  = this.bang;
        
        this.play  = $this._.play;
        this.pause = $this._.pause;
        this.on    = $this._.on;
        this.off   = $this._.off;
        this.bang  = $this._.$bang;
    };
    
    $this.clone = function(deep) {
        var newone = timbre("ar");
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this._.play = function() {
        timbre.fn.do_event(this.args[0], "play");
        return $this._._play.call(this);
    };
    $this._.pause = function() {
        timbre.fn.do_event(this.args[0], "pause");
        return $this._._pause.call(this);
    };
    $this._.on = function() {
        this.args[0].on();
        return $this._._on.call(this);
    };
    $this._.off = function() {
        this.args[0].off();
        return $this._._off.call(this);
    };
    $this._.$bang = function() {
        this.args[0].bang();
        return $this._._bang.call(this);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add;
        var tmp, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
            args = this.args.slice(0);
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (args[i].seq_id === seq_id) {
                    tmp = args[i].cell;
                } else {
                    tmp = args[i].seq(seq_id);
                }
                for (j = jmax; j--; ) {
                    cell[j] += tmp[j];
                }
            }
            for (j = jmax; j--; ) {
                cell[j] = cell[j] * mul + add;
            }
        }
        return cell;
    };
    
    return AR;
}());
timbre.fn.register("ar", AR);

var KR = (function() {
    /**
     * KR: 0.1.0
     * Convert controlrate
     * [kr-only]
     */
    var KR = function() {
        initialize.apply(this, arguments);
    }, $this = KR.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "kr-only");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this._post_init = function() {
        $this._._play  = this.play;
        $this._._pause = this.pause;
        $this._._on    = this.on;
        $this._._off   = this.off;
        $this._._bang  = this.bang;
        
        this.play  = $this._.play;
        this.pause = $this._.pause;
        this.on    = $this._.on;
        this.off   = $this._.off;
        this.bang  = $this._.bang;
    };
    
    $this.clone = function(deep) {
        var newone = timbre("kr");
        timbre.fn.copy_for_clone(this, newone, deep);
        return newone;
    };
    
    $this._.play = function() {
        timbre.fn.do_event(this.args[0], "play");
        return $this._._play.call(this);
    };
    $this._.pause = function() {
        timbre.fn.do_event(this.args[0], "pause");
        return $this._._pause.call(this);
    };
    $this._.on = function() {
        this.args[0].on();
        return $this._._on.call(this);
    };
    $this._.off = function() {
        this.args[0].off();
        return $this._._off.call(this);
    };
    $this._.bang = function() {
        this.args[0].bang();
        return $this._._bang.call(this);
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        var args, cell;
        var mul, add;
        var tmp, i, imax, j, jmax;
        
        cell = this.cell;
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            args = this.args.slice(0);
            tmp  = 0;
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (args[i].seq_id === seq_id) {
                    tmp += args[i].cell[0];
                } else {
                    tmp += args[i].seq(seq_id)[0];
                }
            }
            tmp = tmp * mul + add;
            for (j = jmax; j--; ) {
                cell[j] = tmp;
            }
        }
        return cell;
    };
    
    return KR;
}());
timbre.fn.register("kr", KR);

// __END__

describe("dac", function() {
    object_test(Dac, "dac");
});
describe("ar", function() {
    object_test(AR, "ar", 0);
});
describe("kr", function() {
    object_test(KR, "kr", 0);
});
