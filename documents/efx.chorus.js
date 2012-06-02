timbre.workerpath = "../timbre.js";

ex0 = (function() {
    var synth = T("efx.chorus", T("wav", "public/audio/guitar.wav", true).load());
    
    synth.$listener = T("rec", 100).listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.buffer;
    synth.$listener.onrecorded = function () {
        synth.$listener.on();
    };
    
    synth.$initUI = function() {
        var ui = new CnvUI({elem:"#canvas", width:260, height:120,
                            lineWidth: 3, background:"#999"});
        ui.ctl = ui.set({type:"panel", x:5, y:5,
                         width:250, height:105, background:"#ededed"});
        ui.ctl.set({type:"switch", x:20, y:45, value:true,
                    change:function() {
                        this.value ? synth.on() : synth.off();
                    }});
        ui.ctl.set({type:"label", x:5, y:80, value:"ON/OFF"});
        ui.params1 = ui.ctl.set({type:"label", x:80, y:20, width:50,
                                 align:"center", value:"0.80"});
        ui.ctl.set({type:"knob" , x:80, y:60, radius:15, value:40,
                    change:function() {
                        synth.time = this.value / 50;
                        ui.params1.update((this.value / 50).toFixed(2));
                    }});
        ui.ctl.set({type:"label", x:80, y:80, align:"center", value:"depth"});
        ui.params2 = ui.ctl.set({type:"label", x:140, y:20, width:50,
                                 align:"center", value:"0.5"});
        ui.ctl.set({type:"knob" , x:140, y:60, radius:15, value:12,
                    change:function() {
                        synth.rate = this.value * 0.04;
                        ui.params2.update((this.value * 0.04).toFixed(2));
                    }});
        ui.ctl.set({type:"label", x:140, y:80, align:"center", value:"rate"});
        ui.params3 = ui.ctl.set({type:"label", x:200, y:20, width:50,
                                 align:"center", value:"0.50"});
        ui.ctl.set({type:"knob" , x:200, y:60, radius:15, value:50,
                    change:function() {
                        synth.wet = this.value / 100;
                        ui.params3.update((this.value / 100).toFixed(2));
                    }});
        ui.ctl.set({type:"label", x:200, y:80, align:"center", value:"wet"});
    };
    
    return synth;
}());
