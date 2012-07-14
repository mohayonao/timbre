timbre = T = require("../../../timbre")

timbre.setup({samplerate:48000});
console.log timbre.env

n = T("sin", 880).play()
