const Homey = require("homey");
const MyStromDriver = require("../driver");

module.exports = class MyStromButtonDriver extends MyStromDriver {
	onInit(options = {}) {
		super.onInit(options);

		// Initialize Flow
		const flowCardTriggerName = options.flowCardTriggerName ? options.flowCardTriggerName : "button_pressed";
		this.flowCardTrigger = new Homey.FlowCardTriggerDevice(flowCardTriggerName)
			.register()
			.registerRunListener((args, state) => args.action === state.action);
	}

	onPairListDevices(data, callback) {
		const allDevices = this.getDevices().map(device => device.getData());
		let devices = (Object.values(Homey.app.devices) || []).filter(
			device => !allDevices.find(elm => device.data.mac === elm.mac) && device.data.type == Homey.app.deviceType.WBS
		);

		callback(null, devices);
	}
};
