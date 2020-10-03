"use strict";

const Homey = require("homey");
const Device = require("../device");

const RAMP_DEFAULT = "0";

module.exports = class BulbDevice extends Device {
	onInit(options = {}) {
		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));
		this.registerCapabilityListener("light_mode", this.onCapabilityLightMode.bind(this));
		this.registerCapabilityListener("light_temperature", this.onCapabilityLightTemperature.bind(this));
		this.registerCapabilityListener("light_hue", this.onCapabilityLightHue.bind(this));
		this.registerCapabilityListener("light_saturation", this.onCapabilityLightSaturation.bind(this));
		this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));

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
		const action = value ? "on" : "off";

		return this.setDeviceData("device", `action=${action}`)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("onoff");
				this.notify(Homey.__("device.stateSet", { value: current ? "on" : "off" }));
			})
			.catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
	}

	async onCapabilityLightMode(value, opts) {
		const current = this.getCapabilityValue("light_mode");
		if (current === value) return Promise.resolve();

		this.debug(`onCapabilityLightMode() - ${current} > ${value}`);
		const state = this.getCapabilityValue("onoff") ? "on" : "off";
		const mode = value === "temperature" ? "mono" : "hsv";

		return this.setDeviceData("device", `action=${state}&mode=${mode}`)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("light_mode");
				this.notify(Homey.__("device.modeSet", { value: current }));
			})
			.catch((err) => this.error(`onCapabilityLightMode() > ${err}`));
	}

	async onCapabilityLightTemperature(value, opts) {
		const current = this.getCapabilityValue("light_temperature");
		if (current === value) return Promise.resolve();

		this.debug(`onCapabilityLightTemperature() - ${current} > ${value}`);
		//const state = this.getCapabilityValue("onoff") ? "on" : "off";
		const lightTemperature = value * 100;
		const dim = this.getCapabilityValue("dim") * 100;

		return this.setDeviceData("device", `mode=mono&ramp=${RAMP_DEFAULT}&color=${lightTemperature};${dim}`)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("light_temperature");
				this.notify(Homey.__("device.modeSet", { value: current }));
			})
			.catch((err) => this.error(`onCapabilityLightTemperature() > ${err}`));
	}

	async onCapabilityLightHue(value, opts) {
		const current = this.getCapabilityValue("light_hue");
		if (current === value) return Promise.resolve();

		this.debug(`onCapabilityLightHue() - ${current} > ${value}`);
		//const state = this.getCapabilityValue("onoff") ? "on" : "off";
		const lightHue = value * 360;
		const lightSaturation = this.getCapabilityValue("light_saturation") * 100;
		const dim = this.getCapabilityValue("dim") * 100;

		return this.setDeviceData("device", `mode=hsv&ramp=${RAMP_DEFAULT}&color=${lightHue};${lightSaturation};${dim}`)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("light_hue");
				this.notify(Homey.__("device.hueSet", { value: current * 360 }));
			})
			.catch((err) => this.error(`onCapabilityLightHue() > ${err}`));
	}

	async onCapabilityLightSaturation(value, opts) {
		const current = this.getCapabilityValue("light_saturation");
		if (current === value) return Promise.resolve();

		this.debug(`onCapabilityLightSaturation() - ${current} > ${value}`);
		//const state = this.getCapabilityValue("onoff") ? "on" : "off";
		const lightHue = this.getCapabilityValue("light_hue") * 360;
		const lightSaturation = value * 100;
		const dim = this.getCapabilityValue("dim") * 100;

		return this.setDeviceData("device", `mode=hsv&ramp=${RAMP_DEFAULT}&color=${lightHue};${lightSaturation};${dim}`)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("light_saturation");
				this.notify(Homey.__("device.saturationSet", { value: current * 100 }));
			})
			.catch((err) => this.error(`onCapabilityLightSaturation() > ${err}`));
	}

	async onCapabilityDim(value, opts) {
		const current = this.getCapabilityValue("dim");
		if (current === value) return Promise.resolve();

		this.debug(`onCapabilityDim() - ${current} > ${value}`);
		const dim = value * 100;

		let getValue;
		if (this.getCapabilityValue("light_mode") === "temperature") {
			const lightTemperature = this.getCapabilityValue("light_temperature") * 100;
			getValue = `mode=mono&ramp=${RAMP_DEFAULT}&color=${lightTemperature};${dim}`;
		} else {
			const lightHue = this.getCapabilityValue("light_hue") * 360;
			const lightSaturation = this.getCapabilityValue("light_saturation") * 100;
			getValue = `mode=hsv&ramp=${RAMP_DEFAULT}&color=${lightHue};${lightSaturation};${dim}`;
		}

		return this.setDeviceData("device", getValue)
			.then(await this.getDeviceValues())
			.then(() => {
				const current = this.getCapabilityValue("dim");
				this.notify(Homey.__("device.dimSet", { value: current * 100 }));
			})
			.catch((err) => this.error(`onCapabilityDim() > ${err}`));
	}

	getDeviceValues(url = "device") {
		return super.getDeviceValues(url).then(async (data) => {
			const result = data[Object.keys(data)[0]];
			try {
				const state = result.on;
				const measurePower = Math.round(result.power * 10) / 10;
				const lightMode = result.mode === "mono" ? "temperature" : "color";
				await this.setCapabilityValue("onoff", state);
				await this.setCapabilityValue("measure_power", measurePower);
				await this.setCapabilityValue("light_mode", lightMode);

				if (lightMode === "temperature") {
					const lightTemperature = parseInt(result.color.split(";")[0]) / 100;
					const dim = parseInt(result.color.split(";")[1]) / 100;
					await this.setCapabilityValue("light_temperature", lightTemperature);
					await this.setCapabilityValue("dim", dim);
				} else {
					const lightHue = Math.round((1 / 360) * parseInt(result.color.split(";")[0]) * 100) / 100;
					const lightSaturation = parseInt(result.color.split(";")[1]) / 100;
					const dim = parseInt(result.color.split(";")[2]) / 100;
					await this.setCapabilityValue("light_hue", lightHue);
					await this.setCapabilityValue("light_saturation", lightSaturation);
					await this.setCapabilityValue("dim", dim);
				}
			} catch (err) {
				this.error(err);
			}
			return data;
		});
	}
};
