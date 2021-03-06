"use strict";

const Homey = require("homey");
const Http = require("../lib/http");

module.exports = class Device extends Homey.Device {
	onInit(options = {}) {
		this.log(`Device init...`);
		super.onInit();

		this.setUnavailable(Homey.__("device.waiting"));

		const baseURL = options.baseURL ? options.baseURL : `http://${this.getData().address}/api/v1/`;
		this.api = new Http({ baseURL });

		this.ready(() => {
			this.deviceReady();
		});

		Homey.on("deviceDiscovered", (params) => {
			if (this.getData().id === params.mac && !this.getAvailable()) {
				this.notify(`Device discovered > ${params.mac}`);
				this.deviceReady();
			}
		});

		Homey.on("deviceActionReceived", (params) => {
			if (this.getData().id === params.mac) {
				this.deviceActionReceived(params);
			}
		});
	}

	onAdded() {
		super.onAdded();
		this.notify(`Device ${this.getName()} added`);
	}

	onDeleted() {
		super.onDeleted();
		this.notify(`Device ${this.getName()} deleted`);
	}

	deviceReady() {
		this.notify(`Device ready`);
		this.setAvailable(Homey.__("device.online"));
	}

	deviceActionReceived(params) {
		//this.debug(`deviceActionReceived() > ${JSON.stringify(params)}`);
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

	syncDeviceValues() {
		this.debug("syncDeviceValues()");
		this.getDeviceValues();
	}

	getDeviceValues(url = "", data) {
		this.debug(`getDeviceValues() > url: "${url}"`);
		if (typeof data === "undefined") {
			data = this.getDeviceData(url);
		}
		return Promise.resolve(data);
	}

	getDeviceData(...args) {
		return this.apiGet(...args);
	}

	setDeviceData(...args) {
		return this.apiPost(...args);
	}

	apiGet(url) {
		return this.api.get(url).then(
			(data) => {
				this.debug(`apiGet() >> '${url}'`);
				this.debug(`apiGet() << '${url}' ${JSON.stringify(data)}`);
				this.setAvailable(Homey.__("device.online"));
				return data;
			},
			(err) => {
				if (err.code === "EHOSTUNREACH") {
					this.setUnavailable(Homey.__("device.offline"));
				}
				return err;
			}
		);
	}

	apiPost(url, value) {
		return this.api.post(url, value).then(
			(data) => {
				this.debug(`apiPost() >> '${url}' ${JSON.stringify(value) || "--"}`);
				this.debug(`apiPost() << '${url}' ${JSON.stringify(data) || "--"}`);
				this.setAvailable(Homey.__("device.online"));
				return data;
			},
			(err) => {
				if (err.code === "EHOSTUNREACH") {
					this.setUnavailable(Homey.__("device.offline"));
				}
				return err;
			}
		);
	}

	registerPollInterval(options = {}) {
		if (typeof this.pollIntervals === "undefined") this.pollIntervals = {};
		if (this.pollIntervals.hasOwnProperty(options.id)) this.deregisterPollInterval(options.id);

		const interval = options.sec * 1000;
		this.debug(`Register polling interval (id: ${options.id}, interval: ${interval}ms)`);
		this.pollIntervals[options.id] = setInterval(options.fn, interval);
	}

	deregisterPollInterval(id) {
		if (typeof this.pollIntervals === "undefined") return;

		this.debug(`De-register polling interval (id: ${id})`);
		clearInterval(this.pollIntervals[id]);
		delete this.pollIntervals[id];
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
