const Homey = require("homey");
const MyStromDevice = require("../device");

module.exports = class MyStromSwitch extends MyStromDevice {
	onInit(options = {}) {
		options.baseUrl = `http://${this.getData().address}/`;

		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnoff.bind(this));
		this.registerCapabilityListener("measure_power", this.onCapabilityMeasurePower.bind(this));

		this.registerPollInterval();
	}

	onCapabilityOnoff(value, opts, callback) {
		this.log(`[${this.getName()}] onCapabilityOnoff value: ${value}`);

		return this.apiCallGet({ uri: `relay?state=${value ? "1" : "0"}` })
			.then(result => {
				this.getValues();
			})
			.catch(err => {
				this.error("failed to set capability", err.stack);
				this.setUnavailable(err);
				throw err;
			});
	}

	onCapabilityMeasurePower(value, opts, callback) {
		this.log(`[${this.getName()}] onCapabilityMeasurePower value: ${value}`);
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
					// this.log(`device ${this.getName()} refreshed`);
					this.setAvailable();
				} else {
					this.log(`[${this.getName()}] ${response.toString()}`);
					this.setUnavailable(`Response error ${response.errorResponse.code}`);
				}
			})
			.catch(err => {
				this.error("Failed to get data", err.stack);
				this.setUnavailable(err);
				throw err;
			});
	}
};
