"use strict";

const Homey = require("homey");
const Axios = require("axios");

class Api {
	constructor(config) {
		this.axios = Axios.create(config);

		// Only if the app in debug-mode !!
		if (process.env.DEBUG === "1") {
			this.axios.interceptors.request.use((request) => {
				//this.debug(`Request > ${JSON.stringify(request)}`)
				return request;
			});
			this.axios.interceptors.response.use((response) => {
				//this.debug(`Response > ${JSON.stringify(response.data)}`)
				return response;
			});
		}
	}

	get(url, config = {}) {
		//this.debug(`get() '${url}' > ${JSON.stringify(config)}`);
		return this.axios.get(url, config).then((response) => {
			// this.debug(`get() '${url}' > ${JSON.stringify(response.data)}`)
			return response.data;
		});
	}

	post(url, data, config = {}) {
		if (typeof data === "object" && data !== null) {
			config.headers = { "Content-Type": "application/json" };
		} else if (typeof data === "string" && data !== null) {
			config.headers = { "Content-Type": "text/plain" };
		}

		//this.debug(`post() '${url}' > ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
		return this.axios.post(url, data, config).then((response) => {
			//this.debug(`post() '${url}' > ${JSON.stringify(response.data)}`)
			return response.data;
		});
	}

	put(url, data, config = {}) {
		//this.debug(`put() '${url}' > ${JSON.stringify(data)}, ${JSON.stringify(config)}`);
		return this.axios.put(url, data, config).then((response) => {
			//this.debug(`put() '${url}' > ${JSON.stringify(response.data)}`)
			return response.data;
		});
	}

	delete(url, config = {}) {
		//this.debug(`delete()'${url}' > ${JSON.stringify(config)}`);
		return this.axios.delete(url, config).then((response) => {
			//this.debug(`delete() '${url}' > ${JSON.stringify(response.data)}`)
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
		return `Http.api >`;
	}
}

module.exports = Api;
