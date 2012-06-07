// timbre-synth
ex0 = (function() {
    "use strict";
    
    timbre.setup({samplerate:22050});
    
    var osc1 = T("osc", "pulse", T("glide", 5, 880), 0.25);
    var osc2 = T("osc", "tri"  , T("glide", 5, 880), 0.50);
    var vco  = T("+", osc1, osc2);
    
    var env1 = T("adsr", 50, 100, 1, 0, 2000);
    var vcf  = T("rlpf", T("+", 2300, env1).kr(), vco);
    
    var env2 = T("adsr", 0, 200, 0.5);
    var vca  = T("*", vcf, env2);
    
    var efx1 = T("efx.dist"  , 0, 0, 8000, vca).off();    
    var efx2 = T("efx.chorus", efx1);
    var efx3 = T("efx.delay" , efx2);
    
    var params = { osc1: { waveform:1, freq:8, fine:0 },
                   osc2: { waveform:3, freq:1, fine:0 } };
    
    var score = getScore().split(/\s+/).map(function(x) {
        return (timbre.utils.atom(x) - 12) * 64;
    });
    
    var m64tof = function(m64) {
        return 440 * Math.pow(Math.pow(2, (1/(12*64))), m64 - (69*64));
    };
    
    var metro = T("interval", timbre.utils.bpm2msec(80, 16), function() {
        var note = score[metro.count % score.length];
        osc1.freq.value = m64tof(note + params.osc1.fine) / params.osc1.freq;
        osc2.freq.value = m64tof(note + params.osc2.fine) / params.osc2.freq;
        env1.bang();
        env2.bang();
    });
    
    var ex0 = efx3;

    ex0.onbang = function() {
        osc1.freq.value *= 2;
        osc2.freq.value *= 2;
    };
    ex0.onplay = function() {
        metro.on().bang();
    };
    ex0.onpause = function() {
        metro.off();
    };
    
    ex0.$listener = T("fft").listen(ex0);
    ex0.$view  = ex0.$listener.spectrum;
    ex0.$range = [0, 3000];
    
    ex0.$initUI = function() {
        var WAVES = ["sin","pulse","saw","tri"];
        var FREQS = [ 16, 8, 4, 2, 1, 0.5 ];
        
        var ui = new CnvUI({elem:"#canvas", width:700, height:180,
                            lineWidth: 3, background:"#999"});
        ui.ctl = ui.set({type:"panel", x:5, y:5,
                         width:50, height:165, background:"#ededed"});
        ui.ctl.set({type:"label", x:5, y:5, value:"CTRL"});
        ui.ctl.set({type:"knob" , x:25, y:40, radius:15, value:33,
                    change:function() {
                        var dx = (0.5 + this.value / 65);
                        metro.interval = timbre.utils.bpm2msec(80 * dx, 16);
                    }});
        ui.ctl.set({type:"label", x:25, y:60, align:"center", value:"tempo"});
        ui.ctl.set({type:"knob" , x:25, y:120, radius:15, value:5,
                    change:function() {
                        osc1.freq.duration = (this.value/2) * 5;
                        osc2.freq.duration = (this.value/2) * 5;
                    }});
        ui.ctl.set({type:"label", x:25, y:140, align:"center", value:"glide"});
        ui.vco = ui.set({type:"panel", x:60, y:5,
                         width:160, height:165, background:"#ededed"});
        ui.vco.set({type:"label", x:5, y:5, value:"OSC1"});
        ui.vco.set({type:"knob" , x:30, y:40, radius:15, max:3, value:1,
                    change:function() {
                        if (params.osc1.waveform !== this.value) {
                            params.osc1.waveform = this.value;
                            osc1.wave = WAVES[this.value];
                        }
                    }});
        ui.vco.set({type:"label", x:30, y:60, align:"center", value:"wave"});
        ui.vco.set({type:"knob" , x:80, y:40, radius:15, max:5, value:1,
                    change:function() {
                        params.osc1.freq = FREQS[this.value];
                    }});
        ui.vco.set({type:"label", x:80, y:60, align:"center", value:"octave"});
        ui.vco.set({type:"knob" , x:130, y:40, radius:15, value:50,
                    change:function() {
                        params.osc1.fine = (this.value>>1) - 25;
                    }});
        ui.vco.set({type:"label", x:130, y:60, align:"center", value:"fine"});
        ui.vco.set({type:"label", x:5, y:85, value:"OSC2"});
        ui.vco.set({type:"knob" , x:30, y:120, radius:15, max:3, value:3,
                    change:function() {
                        if (params.osc2.waveform !== this.value) {
                            params.osc2.waveform = this.value;
                            osc2.wave = WAVES[this.value];
                        }
                    }});
        ui.vco.set({type:"label", x:30, y:140, align:"center", value:"wave"});
        ui.vco.set({type:"knob" , x:80, y:120, radius:15, max:5, value:4,
                    change:function() {
                        params.osc2.freq = FREQS[this.value];
                    }});
        ui.vco.set({type:"label", x:80, y:140, align:"center", value:"octave"});
        ui.vco.set({type:"knob" , x:130, y:120, radius:15, value:50,
                    change:function() {
                        params.osc2.fine = (this.value>>1) - 25;
                    }});
        ui.vco.set({type:"label", x:130, y:140, align:"center", value:"fine"});
        ui.mix = ui.set({type:"panel", x:225, y:5,
                         width:80, height:165,background:"#ededed"});
        ui.mix.set({type:"label", x:5, y:5, value:"MIXER"});
        ui.mix.set({type:"knob" , x:30, y:40, radius:15, value:25,
                    change:function() {
                        osc1.mul = this.value / 100;
                    }});
        ui.mix.set({type:"label", x:30, y:60, align:"center", value:"OSC1"});
        ui.mix.set({type:"switch", x:60, y:25, value:true,
                    change:function() {
                        this.value ? osc1.on() : osc1.off();
                    }});
        ui.mix.set({type:"knob" , x:30, y:120, radius:15, value:50,
                    change:function() {
                        osc2.mul = this.value / 100;
                    }});
        ui.mix.set({type:"label", x:30, y:140, align:"center", value:"OSC2"});
        ui.mix.set({type:"switch", x:60, y:105, value:true,
                    change:function() {
                        this.value ? osc2.on() : osc2.off();
                    }});
        ui.vcf = ui.set({type:"panel", x:310, y:5,
                         width:160, height:80, background:"#ededed"});
        ui.vcf.set({type:"label", x:5, y:5, value:"VCF"});
        ui.vcf.set({type:"knob" , x:30, y:40, radius:15, value:50,
                    change:function() {
                        vcf.cutoff.args[0].value = this.value * 40 + 300;
                    }});
        ui.vcf.set({type:"label", x:30, y:60, align:"center", value:"cutoff"});
        ui.vcf.set({type:"knob" , x:80, y:40, radius:15, value:0,
                    change:function() { 
                        vcf.Q = this.value/100;
                    }});
        ui.vcf.set({type:"label", x:80, y:60, align:"center", value:"res"});
        ui.vcf.set({type:"knob" , x:130, y:40, radius:15, value:25,
                    change:function() {
                        env1.mul = this.value * 80;
                    }});
        ui.vcf.set({type:"label", x:130, y:60, align:"center", value:"amount"});
        ui.env = ui.set({type:"panel", x:310, y:90,
                         width:160, height:80, background:"#ededed"});
        ui.env.set({type:"label", x:5, y:5, value:"ENV"});
        ui.env.set({type:"knob" , x:30, y:40, radius:15, value:10,
                    change:function() {
                        env1.a = this.value * 5;
                    }});
        ui.env.set({type:"label", x:30, y:60, align:"center", value:"attack"});
        ui.env.set({type:"knob" , x:80, y:40, radius:15, value:10,
                    change:function() {
                        env1.d = this.value * 10;
                    }});
        ui.env.set({type:"label", x:80, y:60, align:"center", value:"decay"});
        ui.env.set({type:"knob" , x:130, y:40, radius:15, value:100,
                    change:function() {
                        env1.sl = this.value / 100;
                    }});
        ui.env.set({type:"label", x:130, y:60, align:"center", value:"sustain"});
        ui.vca = ui.set({type:"panel", x:475, y:5,
                         width:160, height:80, background:"#ededed"});
        ui.vca.set({type:"label", x:5, y:5, value:"VCA"});
        ui.vca.set({type:"knob" , x:30, y:40, radius:15, value:0,
                    change:function() {
                        env2.a = this.value * 5;
                    }});
        ui.vca.set({type:"label", x:30, y:60, align:"center", value:"attack"});
        ui.vca.set({type:"knob" , x:80, y:40, radius:15, value:20,
                    change:function() {
                        env2.d = this.value * 10;
                    }});
        ui.vca.set({type:"label", x:80, y:60, align:"center", value:"decay"});
        ui.vca.set({type:"knob" , x:130, y:40, radius:15, value:50,
                    change:function() {
                        env2.sl = this.value / 100;
                    }});
        ui.vca.set({type:"label", x:130, y:60, align:"center", value:"sustain"});
        ui.maser = ui.set({type:"panel", x:645, y:5,
                           width:50, height:80, background:"#ededed"});
        ui.maser.set({type:"knob" , x:25, y:40, radius:15, value:50,
                      change:function() {
                          ex0.mul = this.value / 50;
                      }});
        ui.maser.set({type:"label", x:25, y:60, align:"center", value:"master"});
        ui.efx = ui.set({type:"panel", x:475, y:90,
                         width:220, height:80, background:"#ededed"});
        ui.efx.set({type:"label", x:5, y:5, value:"EFX"});
        ui.efx.set({type:"switch", x:15, y:25, value:false,
                    change:function() {
                        this.value ? efx1.on() : efx1.off();
                    }});
        ui.efx.set({type:"knob" , x:45, y:40, radius:15, value:0,
                    change:function() {
                        efx1.post.value = this.value / -2;
                    }});
        ui.efx.set({type:"label", x:45, y:60, align:"center", value:"drive"});
        ui.efx.set({type:"switch", x:85, y:25, value:true,
                    change:function() {
                        this.value ? efx2.on() : efx2.off();
                    }});
        ui.efx.set({type:"knob" , x:115, y:40, radius:15, value:50,
                    change:function() {
                        efx2.wet = this.value / 100;
                    }});
        ui.efx.set({type:"label", x:115, y:60, align:"center", value:"chorus"});
        ui.efx.set({type:"switch", x:155, y:25, value:true,
                    change:function() {
                        this.value ? efx3.on() : efx3.off();
                    }});
        ui.efx.set({type:"knob" , x:185, y:40, radius:15, value:50,
                    change:function() {
                        efx3.wet = this.value / 200;
                    }});
        ui.efx.set({type:"label", x:185, y:60, align:"center", value:"delay"});
    }
    
    function getScore() {
        var Prelude = ""
        Prelude += "C5 E5 G5 C6 E6 G5 C6 E6  C5 E5 G5 C6 E6 G5 C6 E6  "
        Prelude += "C5 D5 A5 D6 F6 A5 D6 F6  C5 D5 A5 D6 F6 A5 D6 F6  "
        Prelude += "B4 D5 G5 D6 F6 G5 D6 F6  B4 D5 G5 D6 F6 G5 D6 F6  "
        Prelude += "C5 E5 G5 C6 E6 G5 C6 E6  C5 E5 G5 C6 E6 G5 C6 E6  "
        Prelude += "C5 E5 A5 E6 A6 A5 E6 A6  C5 E5 A5 E6 A6 A5 E6 A6  "
        Prelude += "C5 D5 F+5 A5 D6 F+5 A5 D6  C5 D5 F+5 A5 D6 F+5 A5 D6  "
        Prelude += "B4 D5 G5 D6 G6 G5 D6 G6  B4 D5 G5 D6 G6 G5 D6 G6 "
        Prelude += "B4 C5 E5 G5 C6 E5 G5 C6  B4 C5 E5 G5 C6 E5 G5 C6 "
        Prelude += "A4 C5 E5 G5 C6 E5 G5 C6  A4 C5 E5 G5 C6 E5 G5 C6 "
        Prelude += "D4 A4 D5 F+5 C6 D5 F+5 C6  D4 A4 D5 F+5 C6 D5 F+5 C6  "
        Prelude += "G4 B4 D5 G5 B5 D5 G5 B5  G4 B4 D5 G5 B5 D5 G5 B5  "
        Prelude += "G4 B-4 E5 G5 C+6 E5 G5 C+6  G4 B-4 E5 G5 C+6 E5 G5 C+6  "
        Prelude += "F4 A4 D5 A5 D6 D5 A5 D6  F4 A4 D5 A5 D6 D5 A5 D6  "
        Prelude += "F4 A-4 D5 F5 B5 D5 F5 B5  F4 A-4 D5 F5 B5 D5 F5 B5  "
        Prelude += "E4 G4 C5 G5 C6 C5 G5 C6  E4 G4 C5 G5 C6 C5 G5 C6  "
        Prelude += "E4 F4 A4 C5 F5 A4 C5 F5  E4 F4 A4 C5 F5 A4 C5 F5  "
        Prelude += "D4 F4 A4 C5 F5 A4 C5 F5  D4 F4 A4 C5 F5 A4 C5 F5  "
        Prelude += "G3 D4 G4 B4 F5 G4 B4 F5  G3 D4 G4 B4 F5 G4 B4 F5  "
        Prelude += "C4 E4 G4 C5 E5 G4 C5 E5  C4 E4 G4 C5 E5 G4 C5 E5  "
        Prelude += "C4 G4 B-4 C5 E5 B-4 C5 E5  C4 G4 B-4 C5 E5 B-4 C5 E5  "
        Prelude += "F3 F4 A4 C5 E5 A4 C5 E5  F3 F4 A4 C5 E5 A4 C5 E5  "
        Prelude += "F+3 C4 A4 C5 E-5 A4 C5 E-5  F+3 C4 A4 C5 E-5 A4 C5 E-5  "
        Prelude += "A-3 F4 B4 C5 D5 B4 C5 D5  A-3 F4 B4 C5 D5 B4 C5 D5  "
        Prelude += "G3 F4 G4 B4 D5 G4 B4 D5  G3 F4 G4 B4 D5 G4 B4 D5  "
        Prelude += "G3 E4 G4 C5 E5 G4 C5 E5  G3 E4 G4 C5 E5 G4 C5 E5  "
        Prelude += "G3 D4 G4 C5 F5 G4 C5 F5  G3 D4 G4 C5 F5 G4 C5 F5  "
        Prelude += "G3 D4 G4 B4 F5 G4 B4 F5  G3 D4 G4 B4 F5 G4 B4 F5  "
        Prelude += "G3 E-4 A4 C5 F+5 A4 C5 F+5  G3 E-4 A4 C5 F+5 A4 C5 F+5  "
        Prelude += "G3 E4 G4 C5 G5 G4 C5 G5  G3 E4 G4 C5 G5 G4 C5 G5  "
        Prelude += "G3 D4 G4 C5 F5 G4 C5 F5  G3 D4 G4 C5 F5 G4 C5 F5  "
        Prelude += "G3 D4 G4 B4 F5 G4 B4 F5  G3 D4 G4 B4 F5 G4 B4 F5  "
        Prelude += "C3 C4 G4 B-4 E5 G4 B-4 E5  C3 C4 G4 B-4 E5 G4 B-4 E5  "
        Prelude += "C3 C4 F4 A4 C5 F5 C5 A4  C5 A4 F4 A4 F4 D4 F4 D4  "
        Prelude += "C3 B3 G5 B5 D6 F6 D6 B5  D6 B5 G5 B5 D5 F5 E5 D5  "
        // Prelude += "C5"
        return Prelude.trim();
    }
    
    return ex0;
}());
