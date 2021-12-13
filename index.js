
const express = require("express");
const fs = require("fs")
const utils = require("./src/utils")
const ascii = /^[ -~]+$/;
const config = JSON.parse(fs.readFileSync("./config.json").toString())
const staticContent = require("./src/static")
const daemon = require("./src/daemon_rpc")
const wallet = require("./src/wallet_rpc")
const db = require("./src/database")
const session = require("express-session");

const WowDaemon = new daemon(config.daemon.ip || "node.suchwow.xyz", config.daemon.port || 34568)
const WowWallet = new wallet(config.wallet_rpc.ip || "127.0.0.1", config.wallet_rpc.port || 34567)


var blocksCount = 377615;

WowDaemon.get_block_count().then((data) => {
	blocksCount = data.count;
})


const DEBUG = false;

var statusMsg = staticContent.statusMsg

// Start up server

var app = express();



app.use(express.urlencoded({
	extended: true
}))
app.use(express.json())
app.use(session({
	secret: config.admin_password,
	resave: true,
	saveUninitialized: true
}));



var server = app.listen(config.port, "0.0.0.0", function () {
	var host = server.address().address
	var port = server.address().port

	LOG("Server listening on http://" + host + ":" + port)
})

app.use(function (err, req, res, next) {
	if (err) {
		return res.status(500).end("500 Internal Server Error")
	}
	if (req.url.toString().includes("..")) {
		return res.status(400).end(statusMsg("Access Denied."))
	}
	next()
})

// Utility functions
{
	function LOG(text) {
		const date_ob = new Date();
		const time = date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds() + " [info]\t"
		console.log(time + text + "\x1b[0m")
	}
	function WARN(text) {
		const date_ob = new Date();
		const time = date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds() + " [WARN]\x1b[1m\x1b[33m\t"
		console.warn(time + text + "\x1b[0m")
	}
	function ERR(text) {
		const date_ob = new Date();
		const time = date_ob.getHours() + ":" + date_ob.getMinutes() + ":" + date_ob.getSeconds() + " [ERR]\x1b[1m\x1b[31m\t"
		console.error(time + text + "\x1b[0m")
	}

	function redirectTo(url) {
		return `<!DOCTYPE HTML><body><meta http-equiv="Refresh" content="0; url='${url}'"></body>`
	}


	function timeDiff(oldTime) {
		const newTime = parseInt(Date.now() / 1000)
		var a = newTime - oldTime
		if (a > 172800) {
			a = `${Math.round(a / 86400)} days ago`
		} else if (a > 7200) {
			a = `${Math.round(a / 3600)}h ago`
		} else if (a > 60) {
			a = `${Math.round(a / 60)}min ago`
		} else {
			a = "Now"
		}
		return a
	}

}

// Requests
{
	const captcha = require("./src/captcha")
	app.get("/captcha", captcha.captchaGet)

	app.post("/stake", (req, res) => {
		if (captcha.requireCaptcha(req, res)) return res.status(400).end(statusMsg(`Wrong captcha.<a href="stake.html"><button>Back</button></a>`))
		if (!req.body || !req.body.txid || !req.body.txkey || !req.body.wallet_a || !req.body.avax_addr)
			return res.status(400).end(statusMsg(`Missing one or more fields.<a href="stake.html"><button>Back</button></a>`))
		if (req.body.txid.length === 66)
			req.body.txid = req.body.txid.slice(1, req.body.txid.length - 1)
		if (req.body.txid.length !== 64 || !ascii.test(req.body.txid))
			return res.status(400).end(statusMsg(`Wrong or invalid TXID.<a href="stake.html"><button>Back</button></a>`))
		if (req.body.txkey.length !== 64 || !ascii.test(req.body.txkey))
			return res.status(400).end(statusMsg(`Wrong or invalid TXKEY.<a href="stake.html"><button>Back</button></a>`))
		if (req.body.wallet_a.length !== 97 || !ascii.test(req.body.wallet_a))
			return res.status(400).end(statusMsg(`Wrong or invalid wallet address.<a href="stake.html"><button>Back</button></a>`))
		if (req.body.avax_addr.length !== 42 || !ascii.test(req.body.wallet_a))
			return res.status(400).end(statusMsg(`Wrong or invalid AVAX address.<a href="stake.html"><button>Back</button></a>`))

		WowDaemon.get_transactions([req.body.txid], true).then((data) => {

			if (data.status !== "OK") return WARN("Daemon RPC get_transactions error: " + data.error.message)
			data.txs[0].as_json = JSON.parse(data.txs[0].as_json)
			console.log(data.txs[0].as_json)

			var lockedTime = data.txs[0].as_json.unlock_time - data.txs[0].block_height

			if (lockedTime < 105180)
				return res.status(400).end(statusMsg(`Sorry, but your lock time is too small.<br>
Maybe you didn't lock the transaction properly.<br><a href="stake.html"><button>Back</button></a>`))

			WowWallet.check_tx_key(req.body.txid, req.body.txkey, req.body.wallet_a).then((data2) => {
				if (data2.in_pool || data2.confirmations < 2) {
					return res.status(400).end(statusMsg(`The transaction isn't confirmed yet.<br>Please wait 5-10 minutes and then try again.
<a href="stake.html"><button>Back</button></a>`))
				}
				var staked = (data2.received / 100000000000).toFixed(3)
				if (staked >= config.minimum_stake) {
					console.log(data2)

					if (db.dupe_exists(req.body.txid))
						return res.status(400).end(statusMsg(`This transaction has already been submitted!
					<br><a href="stake.html"><button>Back</button></a>`))

					db.add_stake(parseFloat(staked), req.body.txid, req.body.txkey,
					req.body.wallet_a, req.body.avax_addr)
					
					theList = null;

					return res.status(200).end(statusMsg(`Successfully staked ${staked}wow.<br>
					${staked}wowx will be sent to your wallet within 48 hours.`))

				} else {
					return res.status(400).end(statusMsg(`You can't stake ${staked}wow!<br> The minimum WOW that can be staked is ${config.minimum_stake}.
					<br><a href="stake.html"><button>Back</button></a>`))
				}
			})

		})
	})

	var theList = null;

	app.get("/list", (req, res) => {
		if (theList) {
			return res.status(200).end(theList)
		} else {

			var txt = ""
			var doc = fs.readFileSync("./public/list.html").toString()
			var datb = db.get_db()
			for (i in datb) {
				txt += `<tr><td class=small>${datb[i].amount}</td>
<td class=mini>${datb[i].txid}</td><td class=mini>${datb[i].tx_key}</td><td class=mini>${datb[i].address}</td>
<td class=mini>${datb[i].avax}</td><td >${utils.bool2emoji(datb[i].was_sent)}</td></tr>`

			}
			theList = statusMsg(doc.replace("%t", txt))
			return res.status(200).end(theList)
		}

	})

	app.post("/mark_as_sent", (req, res) => {
		if (captcha.requireCaptcha(req, res)) return res.status(400).end(statusMsg(`Wrong captcha.<a href="admin.html"><button>Back</button></a>`))
		if (!req.body || !req.body.txid || !req.body.pass) {
			return res.status(400).end(statusMsg(`Missing one or more fields.<a href="admin.html"><button>Back</button></a>`))
		}
		if (req.body.pass !== config.admin_password) {
			return res.status(400).end(statusMsg(`You must type the correct password, not random shit!`))
		}

		db.set_tx(req.body.txid)
		theList = null;
		return res.status(200).end(statusMsg(`Done! Check out <a href="/list">here</a>.`))
	})


}



// Static content
app.use(staticContent.serve)
staticContent.DEBUG = DEBUG;
