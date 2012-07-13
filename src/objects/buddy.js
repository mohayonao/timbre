/**
 * Buddy: 0.1.0
 * Synchronize arriving data, output them together
 * [ar-only]
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var Buddy = (function() {
    var Buddy = function() {
        console.warn("Buddy is deprecated.");
        initialize.apply(this, arguments);
    }, $this = Buddy.prototype;
    
    timbre.fn.setPrototypeOf.call($this, "ar-kr");
    
    var initialize = function(_args) {
        this.args = timbre.fn.valist.call(this, _args);
    };
    
    $this._.init = function() {
        $this._._play  = this.play;
        $this._._pause = this.pause;
        $this._._on    = this.on;
        $this._._off   = this.off;
        $this._._bang  = this.bang;
        
        this.play  = $this._.$play;
        this.pause = $this._.$pause;
        this.on    = $this._.$on;
        this.off   = $this._.$off;
        this.bang  = $this._.$bang;
    };
    
    $this.clone = function(deep) {
        return timbre.fn.copyBaseArguments(this, timbre("buddy"), deep);
    };
    
    $this._.$play = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            timbre.fn.doEvent(args[i], "play");
        }
        return $this._._play.call(this);
    };
    $this._.$pause = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            timbre.fn.doEvent(args[i], "pause");
        }
        return $this._._pause.call(this);
    };
    $this._.$on = function() {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            args[i].on();
        }
        return $this._._on.call(this);
    };
    $this._.$off = function() {
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
    $this.send = function(name, _args) {
        var args, i, imax;
        args = this.args.slice(0);
        for (i = 0, imax = args.length; i < imax; ++i) {
            if (typeof args[i][name] === "function") {
                args[i][name].apply(args[i], _args);
            }
        }
        return this;
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
            if (_.ar) {
                for (j = jmax; j--; ) {
                    cell[j] = 0;
                }
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp = args[i].seq(seq_id);
                    for (j = jmax; j--; ) {
                        cell[j] += tmp[j];
                    }
                }
                for (j = jmax; j--; ) {
                    cell[j] = cell[j] * mul + add;
                }
            } else {
                tmp  = 0;
                for (i = 0, imax = args.length; i < imax; ++i) {
                    tmp += args[i].seq(seq_id)[0];
                }
                tmp = tmp * mul + add;
                for (j = jmax; j--; ) {
                    cell[j] = tmp;
                }
            }
        }
        return cell;
    };
    
    return Buddy;
}());
timbre.fn.register("buddy", Buddy);
// __END__
if (module.parent && !module.parent.parent) {
    /*
    describe("buddy", function() {
        object_test(Buddy, "buddy", 0);
        describe("wrapping event", function() {
            it("should send on when on()", function(done) {
                var instance = timbre("buddy");
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
                var instance = timbre("buddy");
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
                var instance = timbre("buddy");
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
        describe("#send()", function() {
            it("should add signals", function() {
                var instance = timbre("buddy");
                var a = timbre(10);
                var b = timbre(20);
                instance.append(a, b)
                instance.send("set", ["value", 5]);
                instance.seq(0);
                instance.cell.should.eql(timbre(10).cell);
            })
        });
        describe("processing", function() {
            it("should add signals", function() {
                var instance = timbre("buddy");
                var a = timbre(10);
                var b = timbre(20);
                instance.append(a, b)
                instance.seq(0);
                instance.cell.should.eql(timbre(30).cell);
            })
        });
    });
    */
}
