const Homey = require("homey");
const MyStromDevice = require("../device");

module.exports = class MyStromButton extends MyStromDevice {
	onInit(options = {}) {
		super.onInit(options);
		// Register WEB-API events
		Homey.on("myStromButtonGenAction", params => this.buttonGenAction(params));
	}

	onAdded() {
		super.onAdded();
		this.configButton();
	}

	configButton() {
		Homey.ManagerCloud.getLocalAddress()
			.then(localAddress => {
				const data = `get://${localAddress.split(":")[0]}/api/app/ch.mystrom.smarthome/buttonGenAction`;
				return this.apiCallPost({ uri: "/api/v1/action/generic" }, data)
					.then(response => {
						this.debug(`button configured (${data})`);
					})
					.catch(err => {
						this.error(`failed to config button ${err.stack}`);
						this.setUnavailable(err);
						throw err;
					});
			})
			.catch(err => {
				this.error(`failed to get localAddress ${err.stack}`);
				this.setUnavailable(err);
			});
	}

	buttonGenAction(params) {
		if (params.mac === this.getData().mac) {
			this.debug(`action received: ${JSON.stringify(params)}`);

			// Battery-Level
			if (params.battery) {
				const battery = parseInt(params.battery);
				if (typeof this.batteryLevel === "undefined" || this.batteryLevel !== battery) {
					this.batteryLevel = battery;
					this.setCapabilityValue("measure_battery", this.batteryLevel).catch(this.error);
				}
			}
			// Action
			this.getDriver()
				.flowCardTrigger.trigger(this, {}, { action: params.action })
				.catch(this.error);
		}
	}
};
