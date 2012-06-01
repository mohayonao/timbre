timbre.workerpath = "../timbre.js";

ex0 = (function() {
    return T("osc", "sin", 440, 0.25);
}());

ex4 = (function() {
    var add = T("+");
    var a = T("tri", 440);
    var b = T("tri", 660);
    var c = T("tri", 880);

    var i = 0;
    add.onbang = function() {
        if (i === 0) {
            add.append(a, b, c);
        } else if (i === 1) {
            add.remove(a);
        } else if (i === 2) {
            add.args.shift();
        } else if (i === 3) {
            add.args.removeAll();
            i = -1;
        }
        i += 1;
    };
    
    return add;
}());

ex5 = (function() {
    var osc1 = T("tri"  ,  660, 0.25);
    var osc2 = T("pulse", 1320, 0.75);
    return osc1;
}());


ex6 = (function() {
    var sin = T("sin", 880);
    var env = T("adsr", 10, 500);
    var syn = T("*", sin, env);    
    
    syn.onbang = function() {
        sin.bang();
        env.bang();
    };
    
    return syn;
}());

ex7 = (function() {
    var wav = T("wav", "public/audio/amen.wav", true).load();
    
    var dist = T("efx.dist", wav);
    var fami = T("fami", 1320, 0.25);
    var add  = T("+", dist, fami);
    
    add.onbang = function() {
        dist.isOff ? dist.on() : dist.off();
        fami.isOff ? fami.on() : fami.off();
        add .isOff ? add .on() : add .off();
    };
    
    return add;
}());
