"use strict";

const Homey = require("homey");
const Device = require("../device");

module.exports = class ButtonDevice extends Device {
	onInit(options = {}) {
		super.onInit(options);

		this.registerCapabilityListener("button", this.onCapabilityButton.bind(this));

		Homey.on("deviceActionReceived", (params) => {
			this.handleAction(params);
		});

		this.debug("device has been inited");
	}

	onAdded() {
		super.onAdded();
		this.setDeviceActions();
	}

	async handleAction(params) {
		if (params.mac === this.getData().id && params.action <= "4" ){
			this.debug(`handleAction() > ${JSON.stringify(params)}`);
			// Battery-Level
			if (params.battery) {
				await this.setCapabilityValue("measure_battery", parseInt(params.battery));
			}
			// Action
			this.getDriver().triggerButtonPressed(this, {}, { action: params.action });
		}
	}

	onCapabilityButton(value = true, opts) {
		this.debug(`onCapabilityButton() > ${JSON.stringify(arguments)}`);
		// Software-Button only supports: "short press"
		return this.getDriver().triggerButtonPressed(this, {}, { action: 1 });
	}
};
