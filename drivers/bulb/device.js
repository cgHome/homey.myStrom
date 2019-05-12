const Homey = require("homey");
const MyStromDevice = require("../device");

module.exports = class MyStromBulb extends MyStromDevice {
	onInit(options = {}) {
		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));
		this.registerCapabilityListener("light_mode", this.onCapabilityLightMode.bind(this));
		this.registerCapabilityListener("light_temperature", this.onCapabilityLightTemperature.bind(this));
		this.registerCapabilityListener("light_hue", this.onCapabilityLightHue.bind(this));
		this.registerCapabilityListener("light_saturation", this.onCapabilityLightSaturation.bind(this));
		this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));

		this.registerPollInterval();
	}

	async onCapabilityOnOff(value, opts, callback) {
		this.debug(`onCapabilityOnOff value: ${value} (old: ${this.state})`);
		if (this.state === value) {
			return Promise.resolve();
		}

		this.state = value;

		return this.apiCallPost({}, `action=${this.state ? "on" : "off"}`).catch(err => {
			this.error(`failed to set OnOff ${response.toString()}`);
			this.setUnavailable(err);
		});
	}

	async onCapabilityLightMode(value, opts, callback) {
		this.debug(`onCapabilityLightMode value: ${value} (old: ${this.lightMode})`);
		if (this.lightMode === value) {
			return Promise.resolve();
		}

		this.lightMode = value;
		return this.apiCallPost({}, `action=${this.state ? "on" : "off"}&mode=${this.lightMode === "temperature" ? "mono" : "hsv"}`).catch(err => {
			this.error(`failed to set light-mode ${err.stack}`);
			this.setUnavailable(err);
		});
	}

	async onCapabilityLightTemperature(value, opts, callback) {
		this.debug(`onCapabilityLightTemperature value: ${value} (old: ${this.lightTemperature})`);
		if (this.lightTemperature === value) {
			return Promise.resolve();
		}

		this.lightTemperature = value;
		return this.setTemperatureMode();
	}

	async onCapabilityLightHue(value, opts, callback) {
		this.debug(`onCapabilityLightHue value: ${value} (old: ${this.lightHue})`);
		if (this.lightHue === value) {
			return Promise.resolve();
		}

		this.lightHue = value;
		return this.setColorMode();
	}

	async onCapabilityLightSaturation(value, opts, callback) {
		this.debug(`onCapabilityLightSaturation value: ${value} (old: ${this.lightSaturation})`);
		if (this.lightSaturation === value) {
			return Promise.resolve();
		}

		this.lightSaturation = value;
		return this.setColorMode();
	}

	async onCapabilityDim(value, opts, callback) {
		this.debug(`onCapabilityDim value: ${value} (old: ${this.dim})`);
		if (this.dim === value) {
			return Promise.resolve();
		}

		this.dim = value;
		if (this.dim < 0.01) {
			return this.onCapabilityOnOff(false).catch(this.error);
		}
		if (this.lightMode === "temperature") {
			return this.setTemperatureMode();
		}
		return this.setColorMode();
	}

	getValues() {
		return this.apiCallGet()
			.then(response => {
				if (typeof response.errorResponse == "undefined") {
					const result = response[Object.keys(response)[0]];

					const state = result.on;
					if (typeof this.state === "undefined" || this.state !== state) {
						this.debug(`getValues - state value: ${state} (old: ${this.state})`);
						this.state = state;
						this.setCapabilityValue("onoff", this.state).catch(this.error);
					}
					const measurePower = Math.round(result.power * 10) / 10;
					if (typeof this.measurePower === "undefined" || this.measurePower !== measurePower) {
						this.debug(`getValues - measurePower value: ${measurePower} (old: ${this.measurePower})`);
						this.measurePower = measurePower;
						this.setCapabilityValue("measure_power", this.measurePower).catch(this.error);
					}
					const lightMode = result.mode === "mono" ? "temperature" : "color";
					if (typeof this.lightMode === "undefined" || this.lightMode !== lightMode) {
						this.debug(`getValues - lightMode value: ${lightMode} (old: ${this.lightMode})`);
						this.lightMode = lightMode;
						this.setCapabilityValue("light_mode", this.lightMode).catch(this.error);
					}
					if (this.lightMode === "temperature") {
						// color: temperature[mono]-mode
						const lightTemperature = parseInt(result.color.split(";")[0]) / 100;
						if (typeof this.lightTemperature === "undefined" || this.lightTemperature !== lightTemperature) {
							this.debug(`getValues - lightTemperature value: ${lightTemperature} (old: ${this.lightTemperature})`);
							this.lightTemperature = lightTemperature;
							this.setCapabilityValue("light_temperature", this.lightTemperature).catch(this.error);
						}
						const dim = parseInt(result.color.split(";")[1]) / 100;
						if (typeof this.dim === "undefined" || this.dim !== dim) {
							this.debug(`getValues - dim value: ${dim} (old: ${this.dim})`);
							this.dim = dim;
							this.setCapabilityValue("dim", this.dim).catch(this.error);
						}
					} else {
						// color: color[hsv]-mode
						const lightHue = Math.round((1 / 360) * parseInt(result.color.split(";")[0]) * 100) / 100;
						if (typeof this.lightHue === "undefined" || this.lightHue !== lightHue) {
							this.debug(`getValues - lightHue value: ${lightHue} (old: ${this.lightHue})`);
							this.lightHue = lightHue;
							this.setCapabilityValue("light_hue", this.lightHue).catch(this.error);
						}
						const lightSaturation = parseInt(result.color.split(";")[1]) / 100;
						if (typeof this.lightSaturation === "undefined" || this.lightSaturation !== lightSaturation) {
							this.debug(`getValues - lightSaturation value: ${lightSaturation} (old: ${this.lightSaturation})`);
							this.lightSaturation = lightSaturation;
							this.setCapabilityValue("light_saturation", this.lightSaturation).catch(this.error);
						}
						const dim = parseInt(result.color.split(";")[2]) / 100;
						if (typeof this.dim === "undefined" || this.dim !== dim) {
							this.debug(`getValues - dim value: ${dim} (old: ${this.dim})`);
							this.dim = dim;
							this.setCapabilityValue("dim", this.dim).catch(this.error);
						}
					}
					this.setAvailable();
				} else {
					this.error(`response: ${response.toString()}`);
					this.setUnavailable(`Response error: ${response.errorResponse.code}`);
				}
			})
			.catch(err => {
				this.error(`failed to getValues: ${err.stack}`);
				this.setUnavailable(err);
			});
	}

	setTemperatureMode() {
		const data = `mode=mono&ramp=10&color=${Math.round(this.lightTemperature * 100)};${Math.round(this.dim * 100)}`;
		this.debug(`setTemperatureMode: ${data}`);

		if (!this.state) {
			this.onCapabilityOnOff(true).catch(this.error);
		}

		return this.apiCallPost({}, data).catch(err => {
			this.error(`failed to setTemperatureMode: ${err.stack}`);
			this.setUnavailable(err);
		});
	}

	setColorMode() {
		const data = `mode=hsv&ramp=10&color=${Math.round(this.lightHue * 360)};${Math.round(this.lightSaturation * 100)};${Math.round(this.dim * 100)}`;
		this.debug(`setColorMode: ${data}`);

		if (!this.state) {
			this.onCapabilityOnOff(true).catch(this.error);
		}
		
		return this.apiCallPost({}, data).catch(err => {
			this.error(`failed to setColorMode: ${err.stack}`);
			this.setUnavailable(err);
		});
	}

	apiCallPost(options = {}, data) {
		options["uri"] = `${this.getData().id}/`;

		return super.apiCallPost(options, data);
	}
};
