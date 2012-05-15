fs      = require "fs"
express = require "express"

app = module.exports = express.createServer()

app.get "/timbre.js", (req, res)-> res.send fs.readFileSync "#{__dirname}/../timbre.js"
app.get "/"         , (req, res)-> res.send """
<html><head><meta charset="utf-8"/>
<title>timbre</title>
<script type="text/javascript" src="/timbre.js"></script>
</head><body>timbre - JavaScript Library for Objective Sound Programming -</body></html>
"""

app.listen process.env.PORT or 3000
