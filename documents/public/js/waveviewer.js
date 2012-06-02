/**
 * waveviewer.js
 * version: 0.1.3
 */
var WaveViewer = (function() {
    var WaveViewer = function() {
        initialize.apply(this, arguments);
    }, $this = WaveViewer.prototype;
    
    var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame    ||
        window.oRequestAnimationFrame      ||
        window.msRequestAnimationFrame     ||
        function (f) {
            setTimeout(f, 1000/60)
        };
    
    var initialize = function(target, interval, canvas, width, height) {
        if (typeof canvas === "string") {
            canvas = document.getElementById(canvas);
        }
        this.target   = target;
        this.interval = interval;
        this.isUpdated = false;
        this.isPlaying = false;
        this.context = canvas.getContext("2d");
        this.width  = canvas.width  = width;
        this.height = canvas.height = height;
        this.context.fillStyle   = "rgba(255, 255, 255, 0.4)";
        this.context.strokeStyle = "rgba(  0, 128, 255, 0.8)";
        this.context.lineWidth = 2;
        this.range = [-1, +1];
    };
    
    $this.start = function() {
        var self = this;
        var target, interval, range;
        var context, width, height, half_h;
        var prev, stop_delay = 10;
        
        target   = this.target;
        interval = this.interval;
        range    = this.range;
        context  = this.context;
        width    = this.width;
        height   = this.height;
        half_h   = height >> 1;
        prev = 0;
        
        var animate = function() {
            var now, wave, min, max, y, dx, i, imax;
            now = +new Date();
            if (now - prev >= interval) {
                prev = now;
                
                context.fillRect(0, 0, width, height);
                
                if (self.isPlaying) {
                    wave = target;
                    step = (target.length / width)|0;
                    if (step === 0) step = 1;
                    dx   = width / wave.length;
                    min  = range[0];
                    max  = range[1];
                    context.beginPath();
                    y = (wave[0] - min) / (max - min);
                    context.moveTo(0, height - (height * y));
                    for (i = step, imax = wave.length; i < imax; i += step) {
                        y = (wave[i] - min) / (max - min);
                        context.lineTo(i * dx, height - (height * y));
                    }
                    context.stroke();
                } else {
                    interval = 10;
                    --stop_delay;
                }
            }
            if (stop_delay > 0) {
                requestAnimationFrame(animate);
            }
        };
        
        this.isPlaying = true;
        requestAnimationFrame(animate);
    };
    
    $this.pause = function() {
        this.isPlaying = false;
    };
    
    return WaveViewer;
}());
