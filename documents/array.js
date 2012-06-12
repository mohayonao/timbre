ex4 = (function() {

    timbre.utils.exports("atof");
    
    var data;
    data  = "E3 F3 A3 C4 G3 B3 D4 B3 G#3 B3 D4 B3 C4 E4 B3 E4 ";
    data += "E3 F3 A3 C4 G3 B3 D4 B3 F4 E4 D#4 E4 D4 C4 B3 C4"
    
    var array = T(data.split(" ").map(atof));
    var synth = T("fami", array, 0.25);
    
    synth.onplay = function() {
        array.index = 0;
    };
    
    synth.onbang = function() {
        array.bang();
    };
    
    return synth;
}());
