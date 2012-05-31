/**
 * timbre/system
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

/**
 * Dac: 0.0.0
 * Audio output
 * [ar-only]
 */
var Dac = (function() {
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
        _.ison = false;
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


/**
 * AudioRate: 0.0.0
 * Convert audio-rate
 * [ar-only]
 */
var AudioRate = (function() {
    var AudioRate = function() {
        initialize.apply(this, arguments);
    }, $this = AudioRate.prototype;
    
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
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            timbre.fn.do_event(args[i], "play");
        }
        return $this._._play.call(this);
    };
    $this._.pause = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            timbre.fn.do_event(args[i], "pause");
        }
        return $this._._pause.call(this);
    };
    $this._.on = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].on();
        }
        return $this._._on.call(this);
    };
    $this._.off = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].off();
        }
        return $this._._off.call(this);
    };
    $this._.$bang = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].bang();
        }
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
    
    return AudioRate;
}());
timbre.fn.register("ar", AudioRate);


/**
 * KontrolRate: 0.0.0
 * Convert control-rate
 * [kr-only]
 */
var KontrolRate = (function() {
    var KontrolRate = function() {
        initialize.apply(this, arguments);
    }, $this = KontrolRate.prototype;
    
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
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            timbre.fn.do_event(args[i], "play");
        }
        return $this._._play.call(this);
    };
    $this._.pause = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            timbre.fn.do_event(args[i], "pause");
        }
        return $this._._pause.call(this);
    };
    $this._.on = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].on();
        }
        return $this._._on.call(this);
    };
    $this._.off = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].off();
        }
        return $this._._off.call(this);
    };
    $this._.bang = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].bang();
        }
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
    
    return KontrolRate;
}());
timbre.fn.register("kr", KontrolRate);

// __END__

describe("dac", function() {
    object_test(Dac, "dac");
    describe("#play()", function() {
        it("should append self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.should.equal(timbre.dacs[timbre.dacs.length-1]);
        });
    });
    describe("#pause()", function() {
        it("should remove self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.pause();
            timbre.dacs.length.should.equal(i);
        });
    });
    describe("#on()", function() {
        it("should append self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.should.equal(timbre.dacs[timbre.dacs.length-1]);
        });
    });
    describe("#off()", function() {
        it("should remove self from dacs", function() {
            var i, instance = timbre("dac");
            i = timbre.dacs.length;
            instance.play();
            timbre.dacs.length.should.equal(i + 1);
            instance.pause();
            timbre.dacs.length.should.equal(i);
        });
    });
    describe("processing", function() {
        it("should add signals", function() {
            var instance = timbre("dac");
            var a = timbre(10);
            var b = timbre(20);
            instance.append(a, b)
            instance.seq(0);
            instance.cell.should.eql(timbre(30).cell);
        })
    });
});
describe("ar", function() {
    object_test(AudioRate, "ar", 0);
    describe("wrapping event", function() {
        it("should send on when on()", function(done) {
            var instance = timbre("ar");
            var a = timbre(10);
            var b = timbre(20);
            var i = 0;
            instance.append(a, b)
            a.onon = function() { i++; };
            b.onon = function() { i++; };
            instance.onon = function() {
                if (i === 2) done();
            };
            instance.on();
        });
        it("should send off when off()", function(done) {
            var instance = timbre("ar");
            var a = timbre(10);
            var b = timbre(20);
            var i = 0;
            instance.append(a, b)
            a.onoff = function() { i++; };
            b.onoff = function() { i++; };
            instance.onoff = function() {
                if (i === 2) done();
            };
            instance.off();
        });
        it("should send bang when bang()", function(done) {
            var instance = timbre("ar");
            var a = timbre(10);
            var b = timbre(20);
            var i = 0;
            instance.append(a, b)
            a.onbang = function() { i++; };
            b.onbang = function() { i++; };
            instance.onbang = function() {
                if (i === 2) done();
            };
            instance.bang();
        });
    });
    describe("processing", function() {
        it("should add signals", function() {
            var instance = timbre("ar");
            var a = timbre(10);
            var b = timbre(20);
            instance.append(a, b)
            instance.seq(0);
            instance.cell.should.eql(timbre(30).cell);
        })
    });
});
describe("kr", function() {
    object_test(KontrolRate, "kr", 0);
    describe("wrapping event", function() {
        it("should send on when on()", function(done) {
            var instance = timbre("kr");
            var a = timbre(10);
            var b = timbre(20);
            var i = 0;
            instance.append(a, b)
            a.onon = function() { i++; };
            b.onon = function() { i++; };
            instance.onon = function() {
                if (i === 2) done();
            };
            instance.on();
        });
        it("should send off when off()", function(done) {
            var instance = timbre("kr");
            var a = timbre(10);
            var b = timbre(20);
            var i = 0;
            instance.append(a, b)
            a.onoff = function() { i++; };
            b.onoff = function() { i++; };
            instance.onoff = function() {
                if (i === 2) done();
            };
            instance.off();
        });
        it("should send bang when bang()", function(done) {
            var instance = timbre("kr");
            var a = timbre(10);
            var b = timbre(20);
            var i = 0;
            instance.append(a, b)
            a.onbang = function() { i++; };
            b.onbang = function() { i++; };
            instance.onbang = function() {
                if (i === 2) done();
            };
            instance.bang();
        });
    });
    describe("processing", function() {
        it("should add signals", function() {
            var instance = timbre("kr");
            var a = timbre(10);
            var b = timbre(20);
            instance.append(a, b)
            instance.seq(0);
            instance.cell.should.eql(timbre(30).cell);
        })
    });
});
