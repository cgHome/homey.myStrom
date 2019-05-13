const Homey = require("homey");
const MyStromDevice = require("../device");

module.exports = class MyStromSwitch extends MyStromDevice {
	onInit(options = {}) {
		options.baseUrl = `http://${this.getData().address}/`;
		super.onInit(options);

		this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));

		this.registerPollInterval();
	}

	async onCapabilityOnOff(value, opts, callback) {
		this.debug(`onCapabilityOnOff value: ${value} (old: ${this.state})`);
		if (this.state === value) {
			return Promise.resolve();
		}

		this.state = value;

		return this.apiCallGet({ uri: `relay?state=${this.state ? "1" : "0"}` })
			.catch(err => {
				this.error(`failed to set capability ${err.stack}`);
				this.setUnavailable(err);
			});
	}

	getValues() {
		return this.apiCallGet({ uri: "report" })
			.then(response => {
				if (typeof response.errorResponse == "undefined") {
					let state = response.relay;
					if (typeof this.state === "undefined" || this.state !== state) {
						this.debug(`getValues - state value: ${state} (old: ${this.state})`);
						this.state = state;
						this.setCapabilityValue("onoff", this.state).catch(this.error);
					}
					let measurePower = Math.round(response.power * 10) / 10;
					if (typeof this.measurePower === "undefined" || this.measurePower !== measurePower) {
						//this.debug(`getValues - measurePower value: ${measurePower} (old: ${this.measurePower})`);
						this.measurePower = measurePower;
						this.setCapabilityValue("measure_power", this.measurePower).catch(this.error);
					}
					if (response.temperature) {
						let temperature = Math.round(response.temperature * 10) / 10;
						if (typeof this.temperature === "undefined" || this.temperature !== temperature) {
							//this.debug(`getValues - temperature value: ${temperature} (old: ${this.temperature})`);
							this.temperature = temperature;
							this.setCapabilityValue("measure_temperature", this.temperature).catch(this.error);
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
};
