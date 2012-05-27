/**
 * timbre/sys
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var AR = (function() {
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
        var newone;
        newone = timbre("ar");
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
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            for (j = jmax; j--; ) {
                cell[j] = 0;
            }
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
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return AR;
}());
timbre.fn.register("ar", AR);

var KR = (function() {
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
        var newone;
        newone = timbre("ar");
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
            args = this.args.slice(0);
            mul  = _.mul;
            add  = _.add;
            jmax = timbre.cellsize;
            
            for (i = 0, imax = args.length; i < imax; ++i) {
                if (args[i].seq_id === seq_id) {
                    tmp = args[i].cell[0];
                } else {
                    tmp = args[i].seq(seq_id)[0];
                }
                tmp = tmp * mul + add;
                
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
            this.seq_id = seq_id;
        }
        return cell;
    };
    
    return KR;
}());
timbre.fn.register("kr", KR);

// __END__

describe("ar", function() {
    object_test(AR, "ar", 0);
});
describe("kr", function() {
    object_test(KR, "kr", 0);
});
