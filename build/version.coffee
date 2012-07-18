"use strict"

fs   = require("fs")
path = require("path")

mode_replace  = process.argv[2] is "-r"

version = do ->
    d = new Date
    yy = ("00" +  d.getFullYear()).substr(-2)
    mm = ("00" + (d.getMonth()+1)).substr(-2)
    dd = ("00" +  d.getDate()    ).substr(-2)
    "v#{yy}.#{mm}.#{dd}"
console.log "#{version}"

SRC_DIR = path.normalize "#{__dirname}/../src"

for dirname in fs.readdirSync SRC_DIR
    dirpath = "#{SRC_DIR}/#{dirname}"
    continue unless fs.statSync(dirpath).isDirectory()

    for filename in fs.readdirSync dirpath
        continue unless /^.*\.js$/.test filename
        filepath = "#{dirpath}/#{filename}"
        lines = fs.readFileSync(filepath, "utf-8").split "\n"
        for line, i in lines
            index = line.indexOf "<WORKING>"
            if index != -1
                desc = line.substr(index + 9).trim()
                if mode_replace
                    lines[i] = line.replace("<WORKING>", version)
                console.log "#{filename}#{desc}"
        if mode_replace
            source = lines.join "\n";
            fs.writeFileSync filepath, source, "utf-8"
