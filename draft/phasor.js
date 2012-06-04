/**
 * timbre/phasor
 */
(function(timbre) {
    /**
     * Phasor: <draft>
     * [ar-kr]
     */
    var Phasor = (function() {
        var Phasor = function() {
            initialize.apply(this, arguments);
        }, $this = Phasor.prototype;
        
        timbre.fn.setPrototypeOf.call($this, "ar-kr");
        
        Object.defineProperty($this, "freq", {
            set: function(value) {
                this._.freq = timbre(value);
            },
            get: function() { return this._.freq; }
        });
        Object.defineProperty($this, "initPhase", {
            set: function(value) {
                if (typeof value === "number") {
                    while (value >= 1.0) value -= 1.0;
                    while (value <  0.0) value += 1.0;
                    this._.phase = this._.x = value;
                }
            },
            get: function() { return this._.phase; }
        });
        Object.defineProperty($this, "phase", {
            get: function() { return this._.x; }
        });
        
        var initialize = function(_args) {
            var i, _;
            
            this._ = _ = {};
            i = 0;
            
            if (typeof _args[i] !== "undefined") {
                this.freq = _args[i++];
            } else {
                this.freq = 440;
            }
            this.initPhase = typeof _args[i] === "number" ? _args[i++] : 0;
            
            _.x = this._.phase;
            _.coeff = 1 / timbre.samplerate;
        };
        
        $this.bang = function() {
            this._.x = this._.phase;
            timbre.fn.do_event(this, "bang");
            return this;
        };
        
        $this.seq = function(seq_id) {
            var _ = this._;
            var cell;
            var freq, mul, add;
            var x, dx, coeff, xx;
            var i, imax;
            
            if (!_.ison) return timbre._.none;
            
            cell = this.cell;
            if (seq_id !== this.seq_id) {
                this.seq_id = seq_id;
                
                freq  = _.freq.seq(seq_id);
                mul   = _.mul;
                add   = _.add;
                x     = _.x;
                coeff = _.coeff;
                
                if (_.ar) {
                    if (_.freq.isAr) {
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = x * mul + add;
                            x += freq[i] * coeff;
                            while (x > 1.0) x -= 1.0;
                        }
                    } else {
                        dx = freq[0] * coeff;
                        for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                            cell[i] = x * mul + add;
                            x += dx;
                            while (x > 1.0) x -= 1.0;
                        }
                    }
                } else {
                    xx = _.x * _.mul + add;
                    for (i = 0, imax = timbre.cellsize; i < imax; ++i) {
                        cell[i] = xx;
                    }
                    x += freq[0] * coeff * imax;
                    while (x > 1.0) x -= 1.0;
                }
                _.x = x;
            }
            return cell;
        };
        
        return Phasor;
    }());
    timbre.fn.register("phasor", Phasor);
    
}(timbre));
