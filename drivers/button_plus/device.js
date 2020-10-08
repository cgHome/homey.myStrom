"use strict";

const Homey = require("homey");
const ButtonDevice = require("../button/device");

module.exports = class ButtonPlusDevice extends ButtonDevice {
	onInit(options = {}) {
		super.onInit(options);
		
		this.log("ButtonPlusDevice initiated");
	}

	async handleAction(params) {
		if (params.mac === this.getData().id && params.action === "5" && params.wheel) {
			this.debug(`handleAction() - wheel > ${JSON.stringify(params)}`);
			// Battery-Level
			if (params.battery) {
				await this.setCapabilityValue("measure_battery", parseInt(params.battery));
			}
			// Wheel-Value
			this.getDriver().triggerWheelChanged(this, {}, { action: params.action, value: parseInt(params.wheel) });
		} else {
			super.handleAction(params);
		}
	}
};
