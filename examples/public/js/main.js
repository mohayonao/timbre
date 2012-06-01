// main.js 0.0.3
var s = [];
$(function() {
    if (!timbre.isEnabled) $("#caution").show();
    
    var viewer = new WaveViewer(timbre.sys.cell, 60, "waveviewer", 512, 256);
    
    timbre.addEventListener("on", function() {
        $("#title").css("color", "rgb(0, 136, 0)");
        viewer.start();
    });
    timbre.addEventListener("off", function() {
        $("#title").css("color", "rgb(136, 136, 136)");
        viewer.pause();
    });
    
    $("pre").each(function(i, pre) {
        var $pre = $(pre);
        var $elem = $(pre).prev();
        var synth = window[$pre.attr("id")];
        if (!synth || synth instanceof HTMLElement) return;
        
        $("<button>").text("play").on("click", function() {
            if (synth.$ready === false) return;
            $pre.css("background", "rgba(255,224,224,0.75)");
            if (!synth.dac || synth.dac.isOff) {
                if (synth.$listener) synth.$listener.on().bang();
                viewer.target = synth.$view  || timbre.sys.cell;
                viewer.range  = synth.$range || [-1, +1];
                synth.play();
            } else synth.bang();
        }).css("float", "right").insertAfter($elem);
        $("<button>").text("pause").on("click", function() {
            $pre.css("background", "rgba(255,255,255,0.75)");
            synth.pause();
        }).css("float", "right").insertAfter($elem);
        $("<button>").text("bang").on("click", function() {
            synth.bang();
        }).css("float", "right").insertAfter($elem);
        
        if (synth.$initUI) synth.$initUI();
        
        s[i] = synth;
    });
});
