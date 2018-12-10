const Homey = require("homey");
const MyStromDriver = require("../driver");

module.exports = class MyStromButtonDriver extends MyStromDriver {
	onInit(options = {}) {
		super.onInit(options);

		// Initialize Flow
		const flowCardTriggerName = options.flowCardTriggerName ? options.flowCardTriggerName : "button_pressed";
		this.flowCardTrigger = new Homey.FlowCardTriggerDevice(flowCardTriggerName)
			.register()
			.registerRunListener((args, state) => args.button === state.button);
	}

	onPairListDevices(data, callback) {
		let devices = (Object.values(Homey.app.devices) || []).filter(
			device => device.data.type == Homey.app.DeviceTypes.WBS
		);

		callback(null, devices);
	}
};
