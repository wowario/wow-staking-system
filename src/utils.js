// (c) 2021 the Wownero Project


const https = require("https")

module.exports.httpGet = (url, callback) => {
	const request = https.request(url, (res) => {
		var data = "";
		res.on("data", (chunk) => {
			data = data + chunk.toString();
		});

		res.on("end", () => {
			callback(false, data)
		});
	})
	request.on("error", (error) => {
		callback(true, error)
	});
	request.end()
	
}
module.exports.bool2emoji  = (bool) => {
	if (bool) return "✔️"
	else return "❌"
}