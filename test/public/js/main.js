// main.js for test 0.0.3
var s = [];
$(function() {
    "use strict";

    if (typeof tests !== "undefined" && tests.require) {
        var i = tests.require.length;
        tests.require.forEach(function(x) {
            $.ajax({url:x, dataType:"script",
                    success:function() {
                        console.log("loaded:", x);
                        if (--i === 0) main();
                    },
                    error: function() {
                        console.warn("NOT FOUND:", x);
                    }});
        });
    } else {
        main();
    }
    
    function main() {
        var viewer = new WaveViewer(timbre.sys.cell, 60, "waveviewer", 512, 256);

        timbre.addEventListener("on", function() {
            viewer.start();
        });
        timbre.addEventListener("off", function() {
            viewer.pause();
        });
        
        timbre.amp = 0.5;
        typeof tests !== "undefined" && tests.forEach(function(x, i) {
            var synth, $pre;
            
            synth = x.call(null);
            
            if (synth.isKr) {
                synth = T("+", synth).buddy(["on", "off", "bang"]);
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
                .appendTo("#contents");
            
            if (synth.$initUI) synth.$initUI();
            
            s.push(synth);
        });
    }
    
    prettyPrint();
});
