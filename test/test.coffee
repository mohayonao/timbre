fs      = require "fs"
path    = require "path"
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

fetch_source = (filepath)->
    flg = 0
    res = for line in fs.readFileSync(filepath, "utf-8").split "\n"
        if flg is 0
            flg = 1 if line.trim() is "// __BEGIN__"
            continue
        break if line.trim() is "// __END__"
        line
    return res.join "\n"

app.get "/draft/:name", (req, res)->
    filepath = "#{__dirname}/../draft/#{req.params.name}"
    if path.existsSync(filepath)
        res.send fetch_source filepath, {"Content-Type":"text/javascript"}
    else
        filepath = "#{__dirname}/../src/objects/#{req.params.name}"
        if path.existsSync(filepath)
            res.send fetch_source filepath, {"Content-Type":"text/javascript"}
        else res.send(404)

app.get "/test/:test", (req, res)->
    res.send( ejs.render EJS_VIEW, {js:"#{req.params.test}"} )

app.listen process.env.PORT or 3000


EJS_VIEW = """
<html>
  <head>
    <meta charset="utf-8" />
    <title>test: <%= js %></title>
    <link type="text/css" rel="stylesheet" href="/public/css/test.css" />
    <link type="text/css" rel="stylesheet" href="/public/css/prettify.css" />
  </head>
  <body>
    <canvas id="waveviewer"></canvas>
    <section id="body"><h1>test: <%= js %></h1><div id="contents"></div></section>
  </body>
  <script type="text/javascript" src="/public/js/jquery.min.js"></script>
  <script type="text/javascript" src="/timbre.js"></script>
  <script type="text/javascript" src="/<%= js %>"></script>
  <script type="text/javascript" src="/public/js/waveviewer.js"></script>
  <script type="text/javascript" src="/public/js/prettify.js"></script>
  <script type="text/javascript" src="/public/js/main.js"></script>
</html>
"""
