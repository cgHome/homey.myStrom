"use strict";

const Homey = require("homey");
const Http = require("../lib/http");

const HTTP_OPTIONS = { headers: { "Content-Type": "application/json" } };

module.exports = class Device extends Homey.Device {
	async onInit(options = {}) {
		this.debug("device init ...");
		super.onInit();

		const baseURL = options.baseURL ? options.baseURL : `http://${this.getData().address}/api/v1/`;
		this.http = new Http({ baseURL });

		this.setUnavailable(Homey.__("connecting")).catch((err) => {
			this.error(`setUnavailable() > ${err}`);
		});

		this.ready(() => {
			this.log("device ready ...");
			this.deviceReady();
		});

		Homey.on("deviceDiscovered", (params) => {
			if (this.getData().id !== params.mac && !this.getAvailable()) {
				this.log(`device discovered > ${params.mac}`);
				this.deviceReady();
			}
		});
	}

	onAdded() {
		super.onAdded();
		this.log(`device ${this.getName()} added`);
	}

	onDeleted() {
		super.onDeleted();
		this.log(`device ${this.getName()} deleted`);
	}

	deviceReady() {
		this.setAvailable().catch((err) => {
			this.error(`setAvailable() > ${err}`);
		});
	}

	setCapabilityValue(capabilityId, value) {
		const currentValue = this.getCapabilityValue(capabilityId);

		if (typeof value === "undefined" || Number.isNaN(value)) {
			this.error(`setCapabilityValue() '${capabilityId}' - value > ${value}`);
			return Promise.resolve(currentValue);
		} else if (value === currentValue) {
			return Promise.resolve(currentValue);
		}

		return super
			.setCapabilityValue(capabilityId, value)
			.then(() => {
				this.debug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
				return value;
			})
			.catch((err) => {
				this.error(`setCapabilityValue() '${capabilityId}' > ${err}`);
				throw err;
			});
	}

	async initGetDeviceValuesInterval() {
		this.debug("initGetDeviceValuesInterval()");
		this.getDeviceValuesInterval = setInterval(() => {
			this.getDeviceValues();
		}, 1 * 60 * 1000); // set interval to every n minute.
	}

	getDeviceValues(url = "", data) {
		this.debug(`getDeviceValues() > url: "${url}" data: ${JSON.stringify(data)}`);
		return data === undefined ? this.getDeviceData(url) : Promise.resolve(data);
	}

	getDeviceData(...args) {
		return this.httpGet(...args);
	}

	setDeviceData(...args) {
		return this.httpPost(...args);
	}

	httpGet(url) {
		return this.http.get(url).then(
			(data) => {
				this.debug(`httpGet() - '${url}' > ${JSON.stringify(data)}`);
				this.setAvailable().catch((err) => {
					this.error(`setAvailable() > ${err}`);
				});
				return data;
			},
			(err) => {
				const errMsg = `${err.message || err.response.statusText} (${err.code || err.response.status})`;
				this.error(`httpGet() - '${url}' > ${errMsg}`);
				if (err.code === "EHOSTUNREACH") {
					this.setUnavailable(Homey.__("device.error", { code: err.code })).catch((err) => {
						this.error(`setUnavailable() > ${err}`);
					});
				}
				return Error(`http-get - ${err.code}`);
			}
		);
	}

	httpPost(url, value) {
		return this.http.post(url, value).then(
			(data) => {
				this.debug(`httpPost() - '${url}' > ${JSON.stringify(value) || ""}`);
				this.setAvailable().catch((err) => {
					this.error(`setAvailable() > ${err}`);
				});
				return data;
			},
			(err) => {
				const errMsg = `${err.message || err.response.statusText} (${err.code || err.response.status})`;
				this.error(`httpPost() - '${url}' ${JSON.stringify(value)} > ${errMsg}`);
				this.setUnavailable(Homey.__("device.error", { code: err.code })).catch((err) => {
					this.error(`setUnavailable() > ${err}`);
				});
				return Error(`http-post - ${errMsg}}`);
			}
		);
	}

	notify(msg) {
		//new Homey.Notification({ excerpt: `**${this.getName()}** ${msg}` }).register();
		this.log(`Notify: ${msg}`);
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
		return `${this.constructor.name}::${this.getName()} >`;
	}
};
