const Homey = require("homey");
const MyStromButton = require("../button/device");

module.exports = class MyStromButtonPlus extends MyStromButton {
	buttonGenAction(params) {
		if (params.mac === this.getData().mac && params.action === "5" && params.wheel) {
			this.debug(`wheel value received: ${JSON.stringify(params)}`);

			// Battery-Level
			if (params.battery) {
				const battery = parseInt(params.battery);
				if (typeof this.batteryLevel === "undefined" || this.batteryLevel !== battery) {
					this.batteryLevel = battery;
					this.setCapabilityValue("measure_battery", this.batteryLevel).catch(this.error);
				}
			}
			// Wheel-Value
			this.getDriver()
				.flowCardTriggerWheel.trigger(this, { value: parseInt(params.wheel) })
				.catch(this.error);
		} else {
			super.buttonGenAction(params);
		}
	}
};
