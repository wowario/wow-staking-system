const svgCaptcha = require("ppfun-captcha");

svgCaptcha.options.width = 512
svgCaptcha.options.height = 256

svgCaptcha.options.ignoreChars = "0OIlkKW"
const captchaOptions = {
	"size": 4,
	"background": "black",
	"stroke": "white",
	"truncateLineProbability": 0.1,
	"style": "stroke-width: 2;"
}
module.exports.captchaGet = (req, res) => {
	const captcha = svgCaptcha.create(captchaOptions);
	req.session.captcha = captcha.text;
	res.type("svg");
	return res.status(200).send(captcha.data);
}
module.exports.requireCaptcha = (req) => {
	if (!req.body.captcha || req.body.captcha.length < 2 || req.body.captcha !== req.session.captcha) {
		return true;
	}
	req.session.captcha = ""
	return false;
}
