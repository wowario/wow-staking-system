/*
 * Shitty "database".
 * If you want to add a better database
 * system, feel free to make a pull request.
 */

const fs = require("fs")
var db_obj;
try {
	db_obj = JSON.parse(fs.readFileSync("./save/db.json"))
}
catch {
	db_obj = {}
}
	/*"txid": {
		amount: 1000.1,
		txid: "a",
		tx_key: "b",
		address: "c",
		avax: "d",
		was_sent: false,
	}*/


function savedb() {
	fs.writeFile("./save/db.json", JSON.stringify(db_obj, null, "\t"), ()=>{})
	fs.writeFile(`./save/backup/${Math.round(Date.now() / 60 * 1000)}.json`, JSON.stringify(db_obj), ()=>{})
}

/**
 * Adds a new stake to the database.
 * 
 * @param {number} amount The amount staked
 * @param {string} txid The transaction ID
 * @param {string} tx_key The transaction key
 * @param {string} address The wallet main address
 * @param {string} avax The Avalanche address
 */
module.exports.add_stake = function (amount, txid, tx_key, address, avax) {
	db_obj[txid] = {
		amount: amount,
		txid: txid,
		tx_key: tx_key,
		address: address,
		avax: avax,
		was_sent: false
	}
	savedb()
}

/**
 * Checks if an entry already exists.
 * Useful to prevent duplicates.
 * 
 * @param {string} txid The transaction ID
 * @param {string} tx_key The transaction key
 * @param {string} address The wallet main address
 */
module.exports.dupe_exists = (txid) => {
	if (db_obj[txid]) return true;
	return false;
}

/**
 * Gets the database.
 * 
 */
module.exports.get_db = () => {
	return db_obj;
}

/**
 * Sets a transaction as `sent` to the
 * AVAX address.
 * @param {string} txid The transaction
 */
module.exports.set_tx = (txid) => {
	if (!db_obj[txid]) return;
	db_obj[txid].was_sent = true;
	savedb();
}