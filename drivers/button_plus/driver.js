const Homey = require("homey");
const ButtonDriver = require("../button/driver");

module.exports = class ButtonPlusDriver extends ButtonDriver {
	onInit(options = {}) {
		options.triggerName = "button_plus_pressed";
		super.onInit(options);

		this._wheelChangedTrigger = new Homey.FlowCardTriggerDevice("button_plus_wheel")
			.register()
			.registerRunListener(Promise.resolve(true));
	}

	onPairListDevices(data, callback) {
		let devices = (Object.values(Homey.app.devices) || []).filter(
			(device) => device.data.type == Homey.app.deviceType.WBP
		);

		callback(null, devices);
	}

	triggerWheelChanged(device, tokens, state) {
		this._wheelChangedTrigger
			.trigger(device, tokens, state)
			.then(this.log(`${device.getName()} [${this.getActionLabel(state.action)}] wheel changed to: ${state.value}`))
			.catch((err) => this.error(`triggerWheelChanged() > ${err}`));
	}

	getActionLabel(action) {
		const label = super.getActionLabel(action);
		return label !== "unknown" ? label : action === "4" ? "Touch" : action === "5" ? "Wheel" : action === "11" ? "Wheel final" : "unknown";
	}
};
