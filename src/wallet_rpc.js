"use strict";
const request = require("request-promise");
const http = require("http");

class Wallet {
	constructor(hostname, port, user, pass) {
		this.hostname = hostname || "127.0.0.1";
		this.port = port || 34568;
		this.user = user || "";
		this.pass = pass || "";

		this._request("get_block_count");
	}
}

Wallet.prototype._request = function (method, params = '') {
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

/**
 * Wallet  Methods
 * @type {Wallet}
 */

/**
 * https://www.getmonero.org/resources/developer-guides/wallet-rpc.html#check_tx_key
 * 
 * @param {string} txid The transaction ID
 * @param {string} tx_key The transaction key
 * @param {string} address The main wallet address
 */
Wallet.prototype.check_tx_key = function (txid, tx_key, address) {
	var method = "check_tx_key";
	var params = {
		txid: txid,
		tx_key: tx_key,
		address: address
	};
	return this._request(method, params);
}

module.exports = Wallet;
