timbre.workerpath = "../timbre.js";

ex4 = (function() {
    return T("+", T("tri",  783, 0.25),
                  T("tri", 1046, 0.25),
                  T("tri", 1318, 0.25));
}());

ex5 = (function() {
    ex4.$ready = false;
    
    var add = T("+");

    var tones = []
    var score = [ [0],[1],[4],[6], [2],[5],[7],[5],
                  [3],[5],[7],[5], [4,6], [], [2,5], [] ];
    
    T("wav", "./public/audio/piano_cmaj.wav").load(function(res) {
        var dx = this.duration / 9;
        for (var i = 0; i < 9; i++) {
            tones[i] = this.slice(dx * i, dx * i + dx);
        }
        ex4.$ready = true;
    });
    
    function play_piano(i) {
        score[i].forEach(function(x) {
            add.append(tones[x].clone());
        });
        if (add.args.length >= 4) {
            add.args.shift();
        }
    }
    
    var i = 0, metro = T("interval", 300, function() {
        if (i < score.length) play_piano(i++);
    });
    
    add.onbang = function() {
        i = 0;
    };
    add.onplay = function() {
        i = 0;
        metro.on();
    };
    add.onpause = function(){
        metro.off();
    };
    
    return add;
}());
