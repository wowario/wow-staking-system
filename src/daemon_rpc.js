"use strict";
const request = require("request-promise");
const http = require("http");

class Daemon {
	constructor(hostname, port, user, pass) {
		this.hostname = hostname || "127.0.0.1";
		this.port = port || 34568;
		this.user = user || "";
		this.pass = pass || "";

		this._request("get_block_count");
	}
}

// general API Daemon  request
Daemon.prototype._request = function (method, params = '') {
	var options = {
		forever: true,
		json: {"jsonrpc": "2.0", "id": "0", "method": method},
		agent: new http.Agent({
			keepAlive: true,
			maxSockets: 1
		})
	};

	if (params) {
		options["json"]["params"] = params;
	}
	if (this.user) {
		options["auth"] = {
			"user": this.user,
			"pass": this.pass,
			"sendImmediately": false
		}
	}
	return request.post(`http://${this.hostname}:${this.port}/json_rpc`, options)
		.then((result) => {
			if (result.hasOwnProperty("result")) {
				return result.result;
			} else {
				return result;
			}
	});
};

Daemon.prototype._requestN = function (method, params = "") {
	var options = {
		forever: true,
		json: {},
		agent: new http.Agent({
			keepAlive: true,
			maxSockets: 1
		})
	};

	if (params) {
		options["json"] = params;
	}
	if (this.user) {
		options["auth"] = {
			"user": this.user,
			"pass": this.pass,
			"sendImmediately": false
		}
	}
	return request.post(`http://${this.hostname}:${this.port}/${method}`, options)
		.then((result) => {
			if (result.hasOwnProperty("result")) {
				return result.result;
			} else {
				return result;
			}
	});
};

/**
 * Daemon  Methods
 * @type {Daemon}
 */

// Gets blocks count
Daemon.prototype.get_block_count  = function() {
	var method = "get_block_count";
	return this._request(method);
};

// Get transactions
Daemon.prototype.get_transactions = function (txs_hashes, decode_as_json = true) {
	var method = "gettransactions";
	var params = {
		txs_hashes: txs_hashes,
		decode_as_json: decode_as_json
	};
	return this._requestN(method, params);
}

module.exports = Daemon;
