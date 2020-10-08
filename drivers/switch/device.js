"use strict";

const Homey = require("homey");
const Device = require("../device");

module.exports = class SwitchDevice extends Device {
	onInit(options = {}) {
		options.baseURL = `http://${this.getData().address}/`;
		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));

		this.registerPollInterval({
			id: this.getData().id,
			fn: this.syncDeviceValues.bind(this),
			sec: 60, // set interval to every minute
		});

		this.log("SwitchDevice initiated");
	}

	onDeleted() {
		super.onDeleted();
		this.deregisterPollInterval(this.getData().name);
	}

	async deviceReady() {
		try {
			await super.deviceReady();
			await this.getDeviceValues();
		} catch {}
	}

	async onCapabilityOnOff(value, opts) {
		const current = this.getCapabilityValue("onoff");
		if (current === value) return Promise.resolve(true);

		this.debug(`onCapabilityOnOff() - ${current} > ${value}`);
		const state = value ? "1" : "0";

		return this.setDeviceData(`relay?state=${state}`)
			.then(this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("onoff");
				this.notify(Homey.__("device.stateSet", { value: current ? "on" : "off" }));
			})
			.catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
	}

	async getDeviceValues(url = "report") {
		return super
			.getDeviceValues(url)
			.then(async (data) => {
				try {
					await this.setCapabilityValue("onoff", data.relay);
					await this.setCapabilityValue("measure_power", Math.round(data.power * 10) / 10);
					if (data.temperature) {
						await this.setCapabilityValue("measure_temperature", Math.round(data.temperature * 10) / 10);
					}
				} catch (err) {
					throw err;
				}
			})
			.catch((err) => this.error(`getDeviceValues() > ${err.message}`));
	}

	setDeviceData(...args) {
		// switch uses http-Get to set values
		return this.apiGet(...args);
	}
};
