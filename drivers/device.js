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

	setDeviceActions() {
		Homey.ManagerCloud.getLocalAddress()
			.then((localAddress) => {
				const value = `get://${localAddress.split(":")[0]}/api/app/ch.mystrom.smarthome/deviceGenAction`;
				return this.setDeviceData("action/generic", value)
					.then((data) => this.debug(`setDeviceActions() > ${data || "[none]"}`))
					.catch((err) => this.error(`setDeviceActions() > ${err}`));
			})
			.catch((err) => {
				this.error(`getLocalAddress() > ${err}`);
				this.setUnavailable(err).catch((err) => {
					this.error(`setUnavailable() > ${err}`);
				});
			});
	}

	setCapabilityValue(capabilityId, value) {
		const currentValue = this.getCapabilityValue(capabilityId);
		if (currentValue === value) return Promise.resolve(currentValue);

		return super
			.setCapabilityValue(capabilityId, value)
			.then(() => {
				this.debug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
				return value;
			})
			.catch((err) => {
				return this.error(`setCapabilityValue() '${capabilityId}' > ${err}`);
			});
	}

	async initGetDeviceValuesInterval() {
		this.debug("initGetDeviceValuesInterval()");
		this.getDeviceValuesInterval = setInterval(() => {
			this.getDeviceValues();
		}, 1 * 60 * 1000); // set interval to every n minute.
	}

	getDeviceValues(url = "**unknown**") {
		this.debug(`getDeviceValues() - ${url}`);
		return this.getDeviceData(url);
	}

	getDeviceData(url) {
		return this.http.get(url).then(
			(data) => {
				this.debug(`getDeviceData() - '${url}' > ${JSON.stringify(data)}`);
				this.setAvailable().catch((err) => {
					this.error(`setAvailable() > ${err}`);
				});
				return data;
			},
			(err) => {
				this.error(`getDeviceData() - '${url}' > ${err}`);
				this.setUnavailable(Homey.__("device.error", { code: err.response.status })).catch((err) => {
					this.error(`setUnavailable() > ${err}`);
				});
				return Error("get device data failed");
			}
		);
	}

	setDeviceData(url, value) {
		return this.http.post(url, value).then(
			(data) => {
				this.debug(`setDeviceData() - '${url}' > ${JSON.stringify(value) || ""}`);
				this.setAvailable().catch((err) => {
					this.error(`setAvailable() > ${err}`);
				});
				return data;
			},
			(err) => {
				this.error(`setDeviceData() - '${url}' ${JSON.stringify(value)} > ${err}`);
				this.setUnavailable(Homey.__("device.error", { code: err.response.status })).catch((err) => {
					this.error(`setUnavailable() > ${err}`);
				});
				return Error("set device data failed");
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
