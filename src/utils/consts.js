/**
 * utils/consts
 */
"use strict";

var timbre = require("../timbre");
var utils  = { $exports:{} };
// __BEGIN__

utils._1st = 1;
utils._2nd = Math.pow(2, 2/12);
utils._3rd  = Math.pow(2, 4/12);
utils._4th  = Math.pow(2, 5/12);
utils._5th  = Math.pow(2, 7/12);
utils._6th  = Math.pow(2, 9/12);
utils._7th  = Math.pow(2,11/12);
utils._1oct = 2;
utils._9th  = Math.pow(2,14/12);
utils._11th = Math.pow(2,17/12);
utils._13th = Math.pow(2,21/12);

utils.$exports["tension"] = [
    "_1st", "_2nd" , "_3rd", "_4th" , "_5th" , "_6th",
    "_7th", "_1oct", "_9th", "_11th", "_13th",
];

// __END__