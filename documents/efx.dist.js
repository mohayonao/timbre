timbre.workerpath = "../timbre.js";

ex0 = (function() {
    var synth = T("efx.dist", T("wav", "public/audio/guitar.wav", true).load());
    
    synth.$listener = T("rec", 100).listen(synth).off().set("overwrite", true);
    synth.$view = synth.$listener.buffer;
    synth.$listener.onrecorded = function () {
        synth.$listener.on();
    };
    
    synth.$initUI = function() {
        var ui = new CnvUI({elem:"#canvas", width:320, height:120,
                            lineWidth: 3, background:"#999"});
        ui.ctl = ui.set({type:"panel", x:5, y:5,
                         width:310, height:105, background:"#ededed"});
        ui.ctl.set({type:"switch", x:20, y:45, value:true,
                    change:function() {
                        this.value ? synth.on() : synth.off();
                    }});
        ui.ctl.set({type:"label", x:5, y:80, value:"ON/OFF"});
        ui.param1 = ui.ctl.set({type:"label", x:80, y:20, width:50,
                                align:"center", value:"-60"});
        ui.ctl.set({type:"knob" , x:80, y:60, radius:15, value:85,
                    change:function() {
                        synth.pre = 25-this.value;
                        ui.param1.update(25-this.value);
                    }});
        ui.ctl.set({type:"label", x:80, y:80, align:"center", value:"pre"});
        ui.param2 = ui.ctl.set({type:"label", x:140, y:20, width:50,
                                align:"center", value:"18"});
        ui.ctl.set({type:"knob" , x:140, y:60, radius:15, value:7,
                    change:function() {
                        synth.post = 25-this.value;
                        ui.param2.update(25-this.value);
                    }});
        ui.ctl.set({type:"label", x:140, y:80, align:"center", value:"post"});
        ui.param3 = ui.ctl.set({type:"label", x:200, y:20, width:50,
                                align:"center", value:"2400"});
        ui.ctl.set({type:"knob" , x:200, y:60, radius:15, value:29,
                    change:function() {
                        synth.freq = this.value * 78 + 200;
                        ui.param3.update(this.value * 78 + 200);
                    }});
        ui.ctl.set({type:"label", x:200, y:80, align:"center", value:"freq"});
        ui.param4 = ui.ctl.set({type:"label", x:260, y:20, width:50,
                                align:"center", value:"1.00"});
        ui.ctl.set({type:"knob" , x:260, y:60, radius:15, value:100,
                    change:function() {
                        synth.mul = this.value / 100;
                        ui.param4.update((this.value / 100).toFixed(2));
                    }});
        ui.ctl.set({type:"label", x:260, y:80, align:"center", value:"volume"});
    };
    
    return synth;
}());
