/**
 * MML
 * Music Macro Language Processor
 * v12.07.18: first version
 * v12.07.22: bugfix segno(n)
 *            bugfix Synth API send opts as synth.keyon(opts), synth.keyoff(opts)
 *            add properties .synth, .synthdef
 *            add selected
 * v12.07.24: add properties .synthpoly
 *            fix tnum (+1octave)
 *            fix property .mml (setter)
 */
"use strict";

var timbre = require("../timbre");
// __BEGIN__

var MML = (function() {
    var MML = function() {
        initialize.apply(this, arguments);
    }, $this = timbre.fn.buildPrototype(MML, {
        base: ["kr-only", "timer"],
        properties: {
            mml: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "string") {
                        var track = _.tracks[_.selected];
                        if (track) {
                            track.compile(val);
                        } else {
                            _.tracks[_.selected] = new MMLTrack(this, val);
                        }
                    } else if (val === null) {
                        delete _.tracks[_.selected];
                        
                    } else if (typeof val === "object") {
                        for (var key in val) {
                            var x = val[key], track = _.tracks[key];
                            if (x === null) {
                                delete _.tracks[key];
                            } else {
                                if (track) {
                                    track.compile(x);
                                } else {
                                    _.tracks[key] = new MMLTrack(this, x);
                                }
                            }
                        }
                    }
                },
                get: function() {
                    var _ = this._;
                    return _.tracks[_.selected];
                }
            },
            bpm: {
                set: function(val) {
                    if (typeof val === "number") {
                        if (1 <= val && val <= 511) {
                            this._.bpm = val;
                        }
                    }
                },
                get: function() { return this._.bpm; }
            },
            selected: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "string" || typeof val === "number") {
                        if (_.tracks[val] instanceof MMLTrack) {
                            _.selected = val;
                        }
                    }
                },
                get: function() { return this._.selected; }
            },
            synth: {
                set: function(val) {
                    if (timbre.fn.isTimbreObject(val)) {
                        this._.synth = val;
                    }
                },
                get: function() { return this._.synth; }
            },
            synthdef: {
                set: function(val) {
                    var _ = this._;
                    if (typeof val === "function") {
                        _.synthdef = val;
                        var synth = _.synth;
                        if (synth) {
                            while (synth.args.length > 0) {
                                var s = synth.args.shift();
                                if (s && s.tnum) delete synth.keyon[ s.tnum ];
                            }
                        }
                    }
                },
                get: function() { return this._.synthdef; }
            },
            synthpoly: {
                set: function(val) {
                    if (typeof val === "number") {
                        this._.synthpoly = val;
                    }
                },
                get: function() { return this._.synthpoly; }
            },
            currentTime: {
                get: function() { return this._.currentTime; }
            }
        }
    });
    
    var EOM      = 0;
    var TONE     = 1;
    var STATUS   = 2;
    var CONTROL  = 3;
    var EXTERNAL = 4;
    
    var Command = function(name, sign, length, dot) {
        this.name = name;
        if ("><lovkqt&".indexOf(name) !== -1) {
            this.type = STATUS;
        } else if ("$[|]".indexOf(name) !== -1) {
            this.type = CONTROL;
        } else if (name.charAt(0) === "@") {
            this.type = EXTERNAL;
        } else {
            this.type = TONE;
        }
        this.sign = sign;
        if (length !== "") {
            this.length = length|0;
        } else {
            this.length = undefined;
        }
        this.dot = (dot || "").length;
        this.tie = false;
    };
    
    var ReMML = /([><lovkqt&$\[|\]cdefgabr]|@[_a-z]*)([-+#=]?)(\d*)(\.*)/ig;
    var Dots  = [1, 1.5, 1.75, 1.875];
    var atom = function(name, sign, octave) {
        var x = atom.table[name] || 0;
        if (sign === "-") {
            --x;
        } else if (sign === "+" || sign === "#") {
            ++x;
        }
        x += (octave + 1) * 12;
        return x;
    };
    atom.table = {c:0,d:2,e:4,f:5,g:7,a:9,b:11};
    
    var mmtof = function(mm) {
        return mmtof.table[mm] || 0;
    };
    mmtof.table = (function() {
        var result, dx, i, imax;
        result = new Float32Array(128 * 64);
        dx     = Math.pow(2, (1 / (12 * 64)));
        for (i = 0, imax = result.length; i < imax; ++i) {
            result[i] = 440 * Math.pow(dx, i - (69 * 64));
        }
        return result;
    }());
    
    
    var MMLTrack = (function() {
        var MMLTrack = function() {
            initialize.apply(this, arguments);
        }, $this = MMLTrack.prototype;

        var initialize = function(parent, mml) {
            this.parent = parent;
            this.mml = mml;
            
            this.octave   = 4;   // (0 .. 9)
            this.length   = 4;   // (1 .. 1920)
            this.dot      = 0;   // (0 .. 3)
            this.detune   = 0;   // (-8192 .. 8191)
            this.quantize = 6;   // (0 .. 8)
            this.volume   = 8;   // (0 .. 128)
            
            this.compile(mml);
        };
        
        $this.compile = function(mml) {
            var _ = this._;
            
            var m, re = ReMML, commands = [];
            while ((m = re.exec(mml)) !== null) {
                commands.push(new Command(m[1], m[2], m[3], m[4]));
            }
            this.commands = commands;
            
            this.index      =  0;
            this.segnoIndex = {};
            this.loopStack  = [];
            
            var prev_tone = null, tie_cancel = false;
            var segnoIndex = this.segnoIndex;
            for (var i = 0, imax = commands.length; i < imax; ++i) {
                var cmd = commands[i];
                if (cmd.name === "$") {
                    var value = cmd.length;
                    if (value === undefined) value = 0;
                    segnoIndex[value] = i;
                } else if (cmd.type === TONE) {
                    prev_tone  = cmd;
                    tie_cancel = false;
                } else if (cmd.type === CONTROL) {
                    tie_cancel = true;
                } else if (cmd.name === "&") {
                    if (prev_tone && !tie_cancel) prev_tone.tie = true;
                }
            }
            
            sendkeyoff.call(this.parent);
        };
        
        $this.bang = function() {
            this.index     =  0;
            this.loopStack = [];
        };

        $this.segno = function(index) {
            index = this.segnoIndex[index];
            if (index !== undefined) this.index = index;
        };
        
        $this.fetch = function() {
            var cmd = this.commands[this.index++];
            
            if (cmd === undefined) {
                return { type: EOM };
            }
            
            var value = cmd.length;
            
            if (cmd.type === STATUS) {
                switch (cmd.name) {
                case ">":
                    if (this.octave > 0) this.octave -= 1;
                    break;
                case "<":
                    if (this.octave < 9) this.octave += 1;
                    break;
                case "l":
                    if (0 <= value && value <= 1920) {
                        this.length = value;
                        this.dot    = cmd.dot;
                    }
                    break;
                case "o":
                    if (0 <= value && value <= 9) {
                        this.octave = value;
                    }
                    break;
                case "k":
                    if (0 <= value && value <= 8192) {
                        if (cmd.sign === "-") {
                            this.detune = -value;
                        } else {
                            this.detune = +value;
                        }
                    }
                    break;
                case "q":
                    if (0 <= value && value <= 8) {
                        this.quantize = value;
                    }
                    break;
                case "v":
                    if (0 <= value && value <= 128) {
                        this.volume = cmd.length;
                    }
                    break;
                case "t":
                    if (1 <= value && value <= 511) {
                        this.parent._.bpm = value;
                        timbre.fn.doEvent(this.parent, "bpm", [value]);
                    }
                    break;
                }
                cmd = this.fetch();
                
            } else if (cmd.type === CONTROL) {
                
                var loopStack = this.loopStack;
                
                switch (cmd.name) {
                case "[": // loop begin
                    if (value === undefined) value = 2;
                    loopStack.push({
                        count:value, begin:this.index, end:null
                    });
                    break;
                    
                case "]": // loop end
                    if (loopStack.length !== 0) {
                        var stackTop = loopStack[loopStack.length - 1];
                        if (stackTop.end === null) {
                            stackTop.end = this.index;
                            if (typeof value === "number") {
                                stackTop.count = value|0;
                            }
                        }
                        if (stackTop.count <= 1) {
                            loopStack.pop();
                        } else {
                            --stackTop.count;
                            this.index = stackTop.begin;
                        }
                    }
                    break;
                    
                case "|": // loop exit
                    if (loopStack.length !== 0) {
                        var stackTop = loopStack[loopStack.length - 1];
                        if (stackTop.count <= 1) {
                            this.index = stackTop.end;
                            loopStack.pop();
                        }
                    } else {
                        return { type: EOM };
                    }
                    break;
                }
                cmd = this.fetch();
            }
            
            return cmd;
        };
        
        return MMLTrack;
    }());
    
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.bpm     = 120; // (1 .. 511)
        _.samples = Infinity;
        _.keyons  = [];
        _.keyons.samples = 0;
        _.tie       = false;
        _.synth     = null;
        _.synthdef  = null;
        _.synthpoly = 4;
        
        var tracks = {};
        if (typeof _args[0] === "object") {
            var mmls = _args[0];
            for (var key in mmls) {
                tracks[key] = new MMLTrack(this, mmls[key]);
            }
        } else {
            for (var i = 0, imax = _args.length; i < imax; ++i) {
                tracks[i] = new MMLTrack(this, _args[i]);
            }
        }
        
        _.tracks       = tracks;
        _.selected     = 0;
        _.endedEvent  = false;
        
        if (tracks[_.selected]) _.samples = 0;
        
        this.onmml = onmml;
    };
    
    var sendkeyoff = function() {
        var _ = this._;
        
        var keyons = _.keyons;
        while (keyons.length) {
            timbre.fn.doEvent(this, "mml", [
                { cmd:"keyoff", tnum:keyons.shift() }
            ]);
        }
        _.samples += keyons.samples;
        keyons.samples = 0;
    };
    
    var onmml = function(opts) {
        var _ = this._
        var synth    = _.synth;
        var synthdef = _.synthdef;
        
        if (!synth || !synthdef) return;
        if (!synth.keyon) synth.keyon = {};
        
        if (opts.cmd === "keyon") {
            var x = synth.keyon[opts.tnum];
            if (x === undefined) {
                x = synthdef(opts.freq, opts);
                if (x === undefined) return;
                x.tnum = opts.tnum;
                synth.keyon[x.tnum] = x;
                synth.append(x);
            } else {
                x.removeFrom(synth).appendTo(synth); // LRU
            }
            if (x.keyon) x.keyon(opts);
            if (synth.args.length > _.synthpoly) {
                delete synth.keyon[ synth.args.shift().tnum ];
            }
        } else if (opts.cmd === "keyoff") {
            var x = synth.keyon[opts.tnum];
            if (x !== undefined && x.keyoff) x.keyoff(opts);
        }
    };
    
    $this.bang = function() {
        var _ = this._;

        sendkeyoff.call(this);
        
        var track = _.tracks[_.selected];
        if (track) {
            track.bang();
            if (_.samples > 0) _.samples = 0;
            _.endedEvent = false;
        } else {
            _.samples = Infinity;
        }
        _.tie = false;
        
        timbre.fn.doEvent(this, "bang");
        
        return this;
    };
    
    $this._.on = function() {
        this.bang();
    };
    
    $this.segno = function(index) {
        var _ = this._;
        var track = _.tracks[_.selected];
        if (track) {
            track.segno(index);
        }
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;

        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            
            var keyons = _.keyons;
            
            _.sentinel = false;
            while (_.samples <= 0) {
                
                // keyoff
                if (keyons.length > 0 && !_.tie) {
                    sendkeyoff.call(this);
                    continue;
                }
                while (true) { // REDO
                    var track = _.tracks[_.selected];
                    if (track === undefined) break;
                    
                    var cmd = track.fetch();
                    
                    if (cmd.type === TONE) {
                        var dot = cmd.dot;
                        if (dot === 0 && cmd.length === undefined) {
                            dot = track.dot;
                        }
                        var length = cmd.length;
                        if (length === undefined) length = track.length;
                        
                        if (cmd.name !== "r") {
                            var m    = atom(cmd.name, cmd.sign, track.octave);
                            var freq = mmtof((m << 6) + track.detune);
                            if (_.tie) {
                                m = _.keyons[_.keyons.length - 1];
                            } else {
                                _.keyons.push(m);
                            }
                            
                            // send keyon
                            timbre.fn.doEvent(this, "mml", [{
                                cmd   : "keyon", freq  : freq,
                                tnum  : m      , volume: track.volume,
                                length: length , tie   : _.tie
                            }]);
                            _.tie = cmd.tie;
                            
                        } else {
                            m = 0;
                            _.tie = false;
                        }
                        if (length ===  0) continue; // REDO
                        
                        var samples = timbre.samplerate * (60 / _.bpm) * (4 / length);
                        samples *= Dots[dot] || 1;
                        
                        if (m !== 0 && !_.tie) {
                            var keyonsamples = (samples * (track.quantize / 8))|0;
                            keyons.samples = (samples - keyonsamples);
                            _.samples += keyonsamples;
                        } else {
                            _.samples += samples|0;
                        }
                        
                    } else if (cmd.type === EXTERNAL) {
                        // send external
                        var value = null;
                        if (cmd.length !== undefined) {
                            value = cmd.length;
                            if (cmd.sign === "-") value *= -1;
                        }
                        timbre.fn.doEvent(this, "external", [
                            { cmd:cmd.name, value:value }
                        ]);
                        
                    } else if (cmd.type === EOM) {
                        if (_.sentinel) {
                            _.samples = Infinity;
                        } else {
                            _.sentinel   = true;
                            _.endedEvent = true;                            
                            if (track.segnoIndex[0] === undefined) {
                                timbre.fn.doEvent(this, "ended");
                                if (_.endedEvent) _.samples = Infinity;
                            } else {
                                track.index = track.segnoIndex[0];
                                timbre.fn.doEvent(this, "segno");
                            }
                            _.endedEvent = false;
                        }
                    }
                    break;
                }
            }
            _.samples -= timbre.cellsize;
            _.currentTime += (timbre.cellsize / timbre.samplerate) * 1000;
        }
        
        return this.cell;
    };
    
    return MML;
}());
timbre.fn.register("mml", MML);

// __END__
if (module.parent && !module.parent.parent) {
    describe("mml", function() {
        object_test(MML, "mml");
    });
}
