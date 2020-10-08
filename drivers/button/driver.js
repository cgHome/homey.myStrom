"use strict";

const Homey = require("homey");
const Driver = require("../driver");

module.exports = class ButtonDriver extends Driver {
	onInit(options = {}) {
		super.onInit(options);

		// Initialize Flow
		const name = options.triggerName ? options.triggerName : "button_pressed";
		this._buttonPressedTrigger = new Homey.FlowCardTriggerDevice(name)
			.register()
			.registerRunListener((args, state) => args.action === state.action);

		this.log("ButtonDriver initiated");
	}

	onPairListDevices(data, callback) {
		let devices = (Object.values(Homey.app.devices) || []).filter(
			(device) => device.data.type == Homey.app.deviceType.WBS
		);

		callback(null, devices);
	}

	triggerButtonPressed(device, tokens, state) {
		this._buttonPressedTrigger
			.trigger(device, tokens, state)
			.then(this.log(`${device.getName()} [${this.getActionLabel(state.action)}] button pressed`))
			.catch((err) => this.error(`triggerButtonPressed() > ${err}`));
	}

	getActionLabel(action) {
		return action === "1" ? "short" : action === "2" ? "double" : action === "3" ? "long" : "unknown";
	}
};
