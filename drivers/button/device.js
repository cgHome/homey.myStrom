"use strict";

const Homey = require("homey");
const Device = require("../device");

module.exports = class ButtonDevice extends Device {
	async onInit(options = {}) {
		super.onInit(options);

		// Temp - added for app v1.1.0
		if (!this.hasCapability("button")) {
			try {
				await this.addCapability("button");
			} catch (error) {
				this.error(error);
			}
		}

		this.registerCapabilityListener("button", this.onCapabilityButton.bind(this));

		Homey.on("deviceActionReceived", (params) => {
			this.handleAction(params);
		});

		this.log("ButtonDevice initiated");
	}

	onAdded() {
		super.onAdded();
		this.setDeviceActions();
	}

	setDeviceActions() {
		Homey.ManagerCloud.getLocalAddress()
			.then((localAddress) => {
				const value = `get://${localAddress.split(":")[0]}/api/app/ch.mystrom.smarthome/deviceGenAction`;
				return this.setDeviceData("action/generic", value)
					.then((data) => this.debug(`setDeviceActions() > ${data || "[none]"}`))
					.catch((err) => this.error(`setDeviceActions() > ${err}`));
			})
			.catch((err) => {
				this.error(`getLocalAddress() > ${err}`);
			});
	}

	async handleAction(params) {
		if (params.mac === this.getData().id && params.action <= "4") {
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
		this.getDriver().triggerButtonPressed(this, {}, { action: "1" });
		return Promise.resolve(true);
	}
};
