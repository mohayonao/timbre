timbre.workerpath = "../timbre.js";

ex0 = (function() {
    var synth = T("filter", T("wav", "public/audio/amen.wav", true).load());
    
    synth.$listener = T("fft").listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.spectrum;
    synth.$range = [0, 3000];
    
    synth.$initUI = function() {
        var TYPES = ["lpf","hpf","bpf","brf","allpass","peaking","lowboost","highboost"];
        var ui = new CnvUI({elem:"#canvas", width:320, height:120,
                            lineWidth: 3, background:"#999"});
        ui.ctl = ui.set({type:"panel", x:5, y:5,
                         width:310, height:105, background:"#ededed"});
        ui.ctl.set({type:"switch", x:20, y:45, value:true,
                    change:function() {
                        this.value ? synth.on() : synth.off();
                    }});
        ui.ctl.set({type:"label", x:5, y:80, value:"ON/OFF"});
        ui.params1 = ui.ctl.set({type:"label", x:80, y:20, width:80,
                                 align:"center", value:"lpf"});
        ui.ctl.set({type:"knob" , x:80, y:60, radius:15, value:0, max:7,
                    change:function() {
                        synth.type = TYPES[this.value];
                        ui.params1.update(synth.type);
                    }});
        ui.ctl.set({type:"label", x:80, y:80, align:"center", value:"type"});
        ui.params2 = ui.ctl.set({type:"label", x:140, y:20, width:50,
                                 align:"center", value:"800"});
        ui.ctl.set({type:"knob" , x:140, y:60, radius:15, value:8,
                    change:function() {
                        synth.freq = this.value * 78 + 200;
                        ui.params2.update(this.value * 78 + 200);
                    }});
        ui.ctl.set({type:"label", x:140, y:80, align:"center", value:"freq"});
        ui.params3 = ui.ctl.set({type:"label", x:200, y:20, width:50,
                                 align:"center", value:"1.00"});
        ui.ctl.set({type:"knob" , x:200, y:60, radius:15, value:50,
                    change:function() {
                        synth.band = this.value / 50;
                        ui.params3.update((this.value / 50).toFixed(2));
                    }});
        ui.ctl.set({type:"label", x:200, y:80, align:"center", value:"band"});
        ui.params4 = ui.ctl.set({type:"label", x:260, y:20, width:50,
                                 align:"center", value:"6.00"});
        ui.ctl.set({type:"knob" , x:260, y:60, radius:15, value:60,
                    change:function() {
                        synth.gain = this.value / 10;
                        ui.params4.update((this.value / 10).toFixed(2));
                    }});
        ui.ctl.set({type:"label", x:260, y:80, align:"center", value:"gain"});
    };
    
    return synth;
}());

