const fs = require("fs");
const minify = require("html-minifier").minify;
const cCss = require("clean-css");
const cleanCSS = new cCss();

var msgHtml = fs.readFileSync("./public/msg.html").toString()
module.exports.DEBUG = false;


setInterval(function () {
	fs.readFile("../public/msg.html", function (err, data) {
		if (err) return
		msgHtml = data.toString()
	})
}, 5000)


var filesCache = {}

setInterval(()=>{
	if (this.DEBUG) filesCache = {}
}, 1000)


module.exports.serve = (req, res) => {
	DEBUG = is_debug;
	var url = req.url.split("?")[0]
	if (url.endsWith("/")) {
		url += "index.html"
	}
	fs.readFile("./public" + url, function (err, data) {
		if (err) {
			if (err.toString().includes("ENOENT")) {
				return res.status(404).end(module.exports.statusMsg("404 Not Found"))
			} else {
				ERR(`URL ${url} ${err}`)
				return res.status(500).end(module.exports.statusMsg("500 Internal Server Error"))
			}
		}
		if (filesCache[url]) return res.end(filesCache[url])
		if (url.endsWith(".html")) {
			filesCache[url] = minify(msgHtml.replace("%t", data.toString()),
				{
					collapseBooleanAttributes: true,
					collapseWhitespace: true,
					minifyCSS: true,
					processConditionalComments: true,
					removeComments: true,
					removeRedundantAttributes: true,

				})
			res.status(200).end(filesCache[url])
		} else if (url.endsWith(".css")) {
			filesCache[url] = cleanCSS.minify(data.toString()).styles

		}
		return res.status(200).end(data)
	})

}
module.exports.statusMsg = function (text) {
	return msgHtml.replace("%t", text)
}