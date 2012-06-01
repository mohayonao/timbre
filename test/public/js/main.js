// main.js for test 0.0.1
var s = [];
$(function() {
    "use strict";

    var viewer = new WaveViewer(timbre.sys.cell, 60, "waveviewer", 512, 256);

    timbre.addEventListener("on", function() {
        viewer.start();
    });
    timbre.addEventListener("off", function() {
        viewer.pause();
    });
    
    timbre.amp = 0.5;
    tests.forEach(function(x, i) {
        var synth, $pre;
        
        synth = x.call(null);
        
        if (synth.isKr) {
            synth = T("buddy", synth);
        }
        
        $pre = $("<pre>").text(x.toString()).addClass("prettyprint");
        
        $("<div>")
            .append($("<h3>").text("s[" + i + "]: " + x.desc||""))
            .append($("<button>").text("play").on("click", function() {
                if (synth.$ready === false) return;
                $pre.css("background", "rgba(255,224,224,0.75)");
                if (!synth.dac || synth.dac.isOff) {
                    if (synth.$listener) synth.$listener.on().bang();
                    viewer.target = synth.$view  || timbre.sys.cell;
                    viewer.range  = synth.$range || [-1, +1];
                    synth.play();
                } else synth.bang();
            }))
            .append($("<button>").text("pause").on("click", function() {
                $pre.css("background", "rgba(255,255,255,0.75)");
                    synth.pause();
            }))
            .append($("<button>").text("on").on("click", function() {
                synth.on();
            }))
            .append($("<button>").text("off").on("click", function() {
                synth.off();
            }))
            .append($("<button>").text("bang").on("click", function() {
                synth.bang();
            }))
            .append($pre)
            .appendTo("#tests");

        
        synth.addEventListener("play" , function() {
            timbre.on();
        });
        synth.addEventListener("pause", function() {
            synth.dac.off();
            if (s.every(function(synth) {
                return !synth.dac || synth.dac.isOff;
            })) timbre.off();
        });
        
        if (synth.initUI) synth.initUI();
        
        s.push(synth);
    });
    prettyPrint();
});
