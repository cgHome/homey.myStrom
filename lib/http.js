"use strict";

const Homey = require("homey");
const Axios = require("axios");

class Api {
	constructor(config) {
		this.axios = Axios.create(config);

		this.axios.interceptors.request.use((req) => {
			//this.debug(`(req) ${req.method.toUpperCase()}: ${req.baseURL}${req.url} -> ${JSON.stringify(req.data) || "-"}`)
			return req;
		});
		this.axios.interceptors.response.use(
			(res) => {
				//this.debug(`(res) ${res.request.method.toUpperCase()}: ${res.config.baseURL}${res.config.url} -> ${JSON.stringify(res.data)}`)
				return res;
			},
			(err) => {
				const errMsg = `${err.config.method.toUpperCase()}: ${err.config.baseURL}${err.config.url}`;
				if (err.response) {
					this.error(`${errMsg} response > ${err.response.data.message} (${error.response.status})`);
				} else if (err.request) {
					this.error(`${errMsg} request > ${err.request}`);
				} else {
					this.error(`${errMsg} message > ${err.message} ${err.code}`);
				}
				throw err;
			}
		);
	}

	get(url, config = {}) {
		return this.axios.get(url, config).then((response) => {
			return response.data;
		});
	}

	post(url, data, config = {}) {
		return this.axios.post(url, data, config).then((response) => {
			return response.data;
		});
	}

	put(url, data, config = {}) {
		return this.axios.put(url, data, config).then((response) => {
			return response.data;
		});
	}

	delete(url, config = {}) {
		return this.axios.delete(url, config).then((response) => {
			return response.data;
		});
	}

	// Homey-App Loggers
	log(msg) {
		Homey.app.log(`${this._logLinePrefix()} ${msg}`);
	}
	error(msg) {
		Homey.app.error(`${this._logLinePrefix()} ${msg}`);
	}
	debug(msg) {
		Homey.app.debug(`${this._logLinePrefix()} ${msg}`);
	}
	_logLinePrefix() {
		return "Http::Api >";
	}
}

module.exports = Api;
