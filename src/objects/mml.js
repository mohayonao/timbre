/**
 * MML
 * Music Macro Language Processor
 * <WORKING>: first version
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
                    if (typeof val === "string") {
                        this._.mml = val;
                        compile.call(this, val);
                    }
                },
                get: function() { return this._.mml; }
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
        if ("><lovkqt".indexOf(name) !== -1) {
            this.type = STATUS;
        } else if ("&$[|]".indexOf(name) !== -1) {
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
        x += octave * 12;
        return x;
    };
    atom.table = {c:0,d:2,e:4,f:5,g:7,a:9,b:11};
    
    var mmtof = function(mm) {
        return mmtof.table[mm] || 0;
    };
    mmtof.table = (function() {
        var result, dx, i, imax;
        result = new Float32Array(128 * 8192);
        dx     = Math.pow(2, (1 / (12 * 8192)));
        for (i = 0, imax = result.length; i < imax; ++i) {
            result[i] = 440 * Math.pow(dx, i - (69 * 8192));
        }
        return result;
    }());
    
    
    var initialize = function(_args) {
        var _ = this._ = {};
        
        _.bpm      = 120; // (1 .. 511)
        _.octave   = 5;   // (0 .. 9)
        _.length   = 4;   // (1 .. 1920)
        _.dot      = 0;   // (0 .. 3)
        _.detune   = 0;   // (-8192 .. 8191)
        _.quantize = 6;   // (0 .. 8)
        _.volume   = 8;   // (0 .. 128)
        _.keyons = [];
        _.keyons.samples = 0;
        
        var i = 0;
        if (typeof _args[i] === "string") {
            this.mml = _args[i++];
        } else {
            this.mml = "";
        }
        this.onmml = onmml;
    };
    
    var compile = function(mml) {
        var _ = this._;
        
        var m, re = ReMML, commands = [];
        while ((m = re.exec(mml)) !== null) {
            commands.push(new Command(m[1], m[2], m[3], m[4]));
        }
        _.commands = commands;
        
        _.index =  0;
        _.segnoIndex = {};
        _.loopStack  = [];
        _.samples = 0;
        
        sendkeyoff.call(this);
    };
    
    var fetch = function() {
        var _ = this._;
        
        var cmd = _.commands[_.index++];
        if (cmd === undefined) {
            return { type: EOM };
        }
        var value = cmd.length;
        
        if (cmd.type === STATUS) {
            switch (cmd.name) {
            case ">":
                if (_.octave > 0) _.octave -= 1;
                break;
            case "<":
                if (_.octave < 9) _.octave += 1;
                break;
            case "l":
                if (0 <= value && value <= 1920) {
                    _.length = value;
                    _.dot    = cmd.dot;
                }
                break;
            case "o":
                if (0 <= value && value <= 9) {
                    _.octave = value;
                }
                break;
            case "k":
                if (0 <= value && value <= 8192) {
                    if (cmd.sign === "-") {
                        _.detune = -value;
                    } else {
                        _.detune = +value;
                    }
                }
                break;
            case "q":
                if (0 <= value && value <= 8) {
                    _.quantize = value;
                }
                break;
            case "v":
                if (0 <= value && value <= 128) {
                    _.volume = cmd.length;
                }
                break;
            case "t":
                if (1 <= value && value <= 511) {
                    _.bpm = value;
                    timbre.fn.doEvent(this, "bpm", [value]);
                }
                break;
            }
            cmd = fetch.call(this);
        } else if (cmd.type === CONTROL) {
            var loopStack = _.loopStack;
            
            switch (cmd.name) {
            case "[": // loop begin
                if (value === undefined) value = 2;
                loopStack.push({
                    count:value, begin:_.index, end:null
                });
                break;
                
            case "]": // loop end
                if (loopStack.length !== 0) {
                    var stackTop = loopStack[loopStack.length - 1];
                    if (stackTop.end === null) {
                        stackTop.end = _.index;
                        if (typeof value === "number") {
                            stackTop.count = value|0;
                        }
                    }
                    if (stackTop.count <= 1) {
                        loopStack.pop();
                    } else {
                        --stackTop.count;
                        _.index = stackTop.begin;
                    }
                }
                break;
                
            case "|": // loop exit
                if (loopStack.length !== 0) {
                    var stackTop = loopStack[loopStack.length - 1];
                    if (stackTop.count <= 1) {
                        _.index = stackTop.end;
                        loopStack.pop();
                    }
                }
                break;
                
            case "$": // infinite loop
                if (value === undefined) value = 0;
                _.segnoIndex[value] = _.index;
                break;
            }
            cmd = fetch.call(this);
        }
        
        return cmd;
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
    
    var onmml = function(options) {
        var synth    = this.synth;
        var synthdef = this.synthdef;
        
        if (!synth || !synthdef) return;
        
        if (!synth.keyon) synth.keyon = {};
        
        if (options.cmd === "keyon") {
            var x = synth.keyon[options.tnum];
            if (x === undefined) {
                x = synthdef(options.freq, options);
                x.tnum = options.tnum;
                synth.keyon[x.tnum] = x;
                synth.append(x);
            } else {
                x.removeFrom(synth).appendTo(synth); // LRU
            }
            if (x.keyon) x.keyon();
            if (synth.args.length > 4) {
                delete synth.keyon[ synth.args.shift().tnum ];
            }
        } else if (options.cmd === "keyoff") {
            var x = synth.keyon[options.tnum];
            if (x !== undefined && x.keyoff) x.keyoff();
        }
    };
    
    $this.bang = function() {
        var _ = this._;

        sendkeyoff.call(this);
        
        _.index =  0;
        _.segnoIndex = {};
        _.loopStack  = [];
        _.samples = 0;
        
        timbre.fn.doEvent(this, "bang");
        
        return this;
    };
    
    $this.segno = function(index) {
        var _ = this._;
        index = _.segnoIndex[index]
        if (index !== undefined) {
            _.index = index;
        }
    };
    
    $this.seq = function(seq_id) {
        var _ = this._;
        
        if (seq_id !== this.seq_id) {
            this.seq_id = seq_id;
            var keyons = _.keyons;
            
            while (_.samples <= 0) {
                
                // keyoff
                if (keyons.length > 0) {
                    sendkeyoff.call(this);
                    continue;
                }
                
                while (true) { // REDO
                    var cmd = fetch.call(this);
                    if (cmd.type === TONE) {
                        if (cmd.name !== "r") {
                            var m = atom(cmd.name, cmd.sign, _.octave);
                            _.keyons.push(m);
                            
                            var freq = mmtof((m << 13) + _.detune);
                            
                            // send keyon
                            timbre.fn.doEvent(this, "mml", [
                                { cmd : "keyon", freq  : freq,
                                  tnum: m      , volume: _.volume }
                            ]);
                        } else {
                            m = 0;
                        }
                        var dot = cmd.dot;
                        if (dot === 0 && cmd.length === undefined) {
                            dot = _.dot;
                        }
                        var length = cmd.length;
                        if (length === undefined) length = _.length;
                        if (length ===  0) continue; // REDO
                        
                        length = timbre.samplerate * (60 / _.bpm) * (4 / length);
                        length *= Dots[dot] || 1;
                        
                        if (m !== 0) {
                            var keyonlength    = (length * (_.quantize / 8))|0;
                            keyons.samples = (length - keyonlength);
                            _.samples += keyonlength;
                        } else {
                            _.samples += length|0;
                        }
                        
                    } else if (cmd.type === EXTERNAL) {
                        // send external
                        var value = cmd.length || 0;
                        if (cmd.sign === "-") value *= -1;
                        timbre.fn.doEvent(this, "external", [
                            { cmd:cmd.name, value:value }
                        ]);
                        
                    } else if (cmd.type === EOM) {
                        if (_.segnoIndex[0] === undefined) {
                            _.samples = Infinity;
                            timbre.fn.doEvent(this, "ended");
                            this.off();
                        } else {
                            _.index = _.segnoIndex[0];
                            timbre.fn.doEvent(this, "segno");
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
