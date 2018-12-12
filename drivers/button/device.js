const Homey = require("homey");
const MyStromDevice = require("../device");

module.exports = class MyStromButton extends MyStromDevice {
	onInit(options = {}) {
		super.onInit(options);

		// Register WEB-API events
		Homey.on("myStromButtonPressed", data => this.buttonPressed(data));
	}

	onAdded() {
		super.onAdded();
		this.configButton();
	}

	configButton() {
		Homey.ManagerCloud.getLocalAddress()
			.then(localAddress => {
				const ipAddress = localAddress.split(":")[0];
				const url = `get://${ipAddress}/api/app/ch.mystrom.smarthome/buttonPressed`;
				const config = `single=${url}/short&double=${url}/double&long=${url}/long&touch=${url}/touch`;

				return this.apiCallPost(config)
					.then(response => {
						this.getValues();
					})
					.catch(err => {
						this.error("failed to config button", err.stack);
						this.setUnavailable(err);
						throw err;
					});
			})
			.catch(err => {
				this.error("failed to get localAddress", err.stack);
				this.setUnavailable(err);
			});
	}

	buttonPressed(data) {
		if (data.address === this.getData().address) {
			this.log(`[${this.getName()}] ${data.button}-button pressed`);

			this.getDriver()
				.flowCardTrigger.trigger(this, null, { button: data.button })
				.catch(this.error);

			// this.getValues();
		}
	}

	getValues() {
		return this.apiCallGet()
			.then(response => {
				if (typeof response.errorResponse == "undefined") {
					const result = response[Object.keys(response)[0]];

					let measureVoltage = result.voltage;
					if (typeof this.measureVoltage === "undefined" || this.measureVoltage !== measureVoltage) {
						this.measureVoltage = measureVoltage;
						this.setCapabilityValue("measure_voltage", this.measureVoltage);
					}
					this.log(`[${this.getName()}] device refreshed ...`);
					this.setAvailable();
				} else {
					this.error(`[${this.getName()}] ${response.toString()}`);
					// this.setUnavailable(`Response error ${response.errorResponse.code}`);
				}
			})
			.catch(err => {
				this.error(`[${this.getName()}] failed to get values ${err.stack}`);
				this.setUnavailable(err);
				throw err;
			});
	}
};
