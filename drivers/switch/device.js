"use strict";

const Homey = require("homey");
const Device = require("../device");

module.exports = class SwitchDevice extends Device {
	onInit(options = {}) {
		options.baseURL = `http://${this.getData().address}/`;
		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));

		//this.initGetDeviceValuesInterval();
		this.debug("device has been inited");
	}

	onDeleted() {
		super.onDeleted();
		clearInterval(this.getDeviceValuesInterval);
	}

	async deviceReady() {
		try {
			await super.deviceReady();
			await this.getDeviceValues();
		} catch {}
	}

	async onCapabilityOnOff(value, opts) {
		const current = this.getCapabilityValue("onoff");
		if (current === value) return Promise.resolve();

		this.debug(`onCapabilityOnOff() - ${current} > ${value}`);
		const state = value ? "1" : "0";

		return this.setDeviceData(`relay?state=${state}`)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("onoff");
				this.notify(Homey.__("device.stateSet", { value: current ? "on" : "off" }));
			})
			.catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
	}

	getDeviceValues(url = "report") {
		return super.getDeviceValues(url).then(async (data) => {
			try {
				await this.setCapabilityValue("onoff", data.relay);
				await this.setCapabilityValue("measure_power", Math.round(data.power * 10) / 10);
				await this.setCapabilityValue("measure_temperature", Math.round(data.temperature * 10) / 10);
			} catch (err) {
				this.error(err);
			}
			return data;
		});
	}
};
