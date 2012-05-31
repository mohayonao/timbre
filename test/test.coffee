fs      = require "fs"
ejs     = require "ejs"
express = require "express"

app = module.exports = express.createServer()

app.configure ->
    app.use express.bodyParser()
    app.use express.methodOverride()
    app.use app.router
    app.use express.static __dirname

app.get "/timbre.js", (req, res)->
    res.send (fs.readFileSync "#{__dirname}/../timbre.js", "utf-8"),
     {"Content-Type":"text/javascript"}

app.get "/test/:test", (req, res)->
    res.send( ejs.render EJS_VIEW, {js:"#{req.params.test}"} )

app.listen process.env.PORT or 3000


EJS_VIEW = """
<html>
  <head>
    <meta charset="utf-8" />
    <title>timbre : test <%= js %></title>
    <link type="text/css" rel="stylesheet" href="/public/css/test.css" />
    <link type="text/css" rel="stylesheet" href="/public/css/prettify.css" />
  </head>
  <body>
    <canvas id="waveviewer"></canvas>
    <section id="body"><h1>test <%= js %></h1><div id="tests"></div></section>
  </body>
  <script type="text/javascript" src="/timbre.js"></script>
  <script type="text/javascript" src="/<%= js %>"></script>
  <script type="text/javascript" src="/public/js/waveviewer.js"></script>
  <script type="text/javascript" src="/public/js/prettify.js"></script>
  <script type="text/javascript" src="/public/js/jquery.min.js"></script>

  <script type="text/javascript">
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
          var synth, pre;

          synth = x.call(null);

          if (synth.isKr) {
              synth = T("ar", synth);
          }

          synth.addEventListener("play" , function() {
              pre.css("background", "rgba(255,224,224,0.75)");
              if (synth.listener) {
                  synth.listener.on().bang();
                  viewer.target = synth.listener.buffer;
                  viewer.step =  100;
                  viewer.stay = true;
              } else {
                  viewer.target = timbre.sys.cell;
                  viewer.step =  1;
                  viewer.stay = false;
              }
              timbre.on();
          });
          synth.addEventListener("pause", function() {
              pre.css("background", "rgba(255,255,255,0.75)");
              synth.dac.off();
              if (s.every(function(synth) {
                  return !synth.dac || synth.dac.isOff;
              })) timbre.off();
          });

          pre = $("<pre>").text(x.toString()).addClass("prettyprint");

          $("<div>")
            .append($("<h3>").text("s[" + i + "]: " + x.desc||""))
            .append($("<button>").text("play").on("click", function() {
                synth.play();
            }))
            .append($("<button>").text("pause").on("click", function() {
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
            .append(pre)
            .appendTo("#tests");

          s.push(synth);
      });
      prettyPrint();
  });
  </script>
</html>
"""
