const Homey = require("homey");
const MyStromDevice = require("../device");

module.exports = class MyStromSwitch extends MyStromDevice {
	onInit(options = {}) {
		options.baseUrl = `http://${this.getData().address}/`;

		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));
		this.registerCapabilityListener("measure_power", this.onCapabilityMeasurePower.bind(this));

		// WiFi Switch v2
		if (this.getData().type == Homey.app.DeviceTypes.WS2) {
			this.registerCapabilityListener("measure_temperaturer", this.onCapabilityMeasureTemp.bind(this));
		}

		this.registerPollInterval();
	}

	onCapabilityOnoff(value, opts, callback) {
		this.debug(`onCapabilityOnoff value: ${value}`);

		return this.apiCallGet({ uri: `relay?state=${value ? "1" : "0"}` })
			.then(result => {
				this.getValues();
			})
			.catch(err => {
				this.error(`failed to set capability ${err.stack}`);
				this.setUnavailable(err);
				throw err;
			});
	}

	onCapabilityMeasurePower(value, opts, callback) {
		this.debug(`onCapabilityMeasurePower value: ${value}`);
	}

	onCapabilityMeasureTemp(value, opts, callback) {
		this.debug(`onCapabilityMeasureTemp value: ${value}`);
	}

	getValues() {
		return this.apiCallGet({ uri: "report" })
			.then(response => {
				if (typeof response.errorResponse == "undefined") {
					let state = response.relay;
					if (typeof this.state === "undefined" || this.state !== state) {
						this.state = state;
						this.setCapabilityValue("onoff", this.state);
					}
					let measurePower = Math.round(response.power * 10) / 10;
					if (typeof this.measurePower === "undefined" || this.measurePower !== measurePower) {
						this.measurePower = measurePower;
						this.setCapabilityValue("measure_power", this.measurePower);
					}
					//this.debug(`device refreshed`);
					this.setAvailable();
				} else {
					this.debug(`${response.toString()}`);
					this.setUnavailable(`Response error ${response.errorResponse.code}`);
				}
			})
			.catch(err => {
				this.error(`failed to get data ${err.stack}`);
				this.setUnavailable(err);
				throw err;
			});
	}

	getTemp() {
		return this.apiCallGet({ uri: "temp" })
			.then(response => {
				if (typeof response.errorResponse == "undefined") {
					let measureTemp = Math.round(response.measured * 10) / 10;
					if (typeof this.measureTemp === "undefined" || this.measureTemp !== measureTemp) {
						this.measureTemp = measureTemp;
						this.setCapabilityValue("measure_temperature", this.measureTemp);
					}
					this.debug(`device ${this.getName()} refreshed`);
					this.setAvailable();
				} else {
					this.debug(`${response.toString()}`);
					this.setUnavailable(`Response error ${response.errorResponse.code}`);
				}
			})
			.catch(err => {
				this.error(`failed to get data ${err.stack}`);
				this.setUnavailable(err);
				throw err;
			});
	}
};
