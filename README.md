Timbre.js
========

#### JavaScript Library for Objective Sound Programming ####

[Project Page](http://mohayonao.github.com/timbre/) — [Documentation](http://mohayonao.github.com/timbre/documents) — [Example01](http://mohayonao.github.com/timbre/examples/002_rhythmsequencer.html)  — [Example02](http://mohayonao.github.com/timbre/examples/003_loadwavfiles.html)  — [Example03](http://mohayonao.github.com/timbre/examples/004_timbresynth.html)


### System Requirements ###
* Chrome 14.0- (Web Audio API)
* Safari 6.0- (Web Audio API)
* Firefox 4.0- (Audio Data API)


### Usage ###

Download the [minified library](http://mohayonao.github.com/timbre/timbre.min.js) and include it in your html.
```html
<script src="timbre.min.js"></script>
```

Timbre.js is so easy.
```js
// generate a 523Hz(C4) sine
T("sin", 523.25).play();
```

It's useful and powerful.
```js
// generate a chord C-major 
T("+", T("sin", 523.35),
       T("sin", 659.25),
       T("sin", 783.99)).set({mul: 0.25}).play();
```

Looks a bit like CUI Max/MSP??? SuperCollider??
```js
// tremolo & decay  
T("*", T("+", T("sin", 523.35),
              T("sin", 659.25),
              T("sin", 783.99)).set({mul: 0.25}),
       T("+tri", 2),
       T("adsr", 100, 2500).bang()).play();
```

### License ###

MIT

### ChangeLog ###
2012 07 08 - **v0.3.7** (294.64 KB, minified:110.66 KB)
* Add `T("-")` subtract signals
* Add `T("/")` divide signals
* Add `T("%")` modulo signals
* Add `T("math")` math functions
* Improved `T("audio").src` accept a [File Object]


2012 06 21 - **v0.3.6** (272.25 KB, minified:103.22 KB)
* Added `T("pink")` pink noise generator
* Added `T("pong)` signal folding
* Added `T("a&h")` sample & hold
* Improved `T("adsr")`, `T("perc")` arguments for constructor


2012 06 20 - **v0.3.5** (257.92 KB, minified:98.90 KB)
* Improved `T("audio")` by selecting audio sources(*.ogg, *.mp3, *.wav)


2012 06 20 - **v0.3.4** (257.07 KB, minified:98.58 KB)
* Safari 6


2012 06 19 - **v0.3.3** (256.87 KB, minified:98.52 KB)
* Added `T("clip")`, `T("pwm")`
* Improved `T("adsr)`, `T("perc")` by adding envelope curves.
* Removed `timbre.fn.doEvent` that is an inline-expands function 


2012 06 17 - **v0.3.2** (292.79 KB, minified:107.25 KB)
* Update `compiler.coffee` for Inline-expands functions, improve performance??


2012 06 14 - **v0.3.1**
* Improved `T("schedule")`


2012 06 12 - **v0.3.0** (241.66 KB, minified:94.13 KB)
* Added `T("schedule")`, `T("scale")`


2012 06 07 - **v0.2.1**
* Added `timbre.setup()` that the initial configuration


2012 06 04 - **v0.2.0** (217.75 KB, minified:84.00 KB)
* Added `T("phasor")`, `T("oscx")`
* Added `T().isUndefined` property


2012 06 02 - **v0.1.0** (206.26 KB, minified:79.67 KB)

* Initial release of Timbre.js
