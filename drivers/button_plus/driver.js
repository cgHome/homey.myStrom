const Homey = require("homey");
const MyStromButtonDriver = require("../button/driver");

module.exports = class MyStromButtonPlusDriver extends MyStromButtonDriver {
	onInit(options = {}) {
		options.flowCardTriggerName = "button_plus_pressed";

		super.onInit(options);

		this.flowCardTriggerWheel = new Homey.FlowCardTriggerDevice("button_plus_wheel")
			.register()
			.registerRunListener(Promise.resolve(true));
	}

	onPairListDevices(data, callback) {
		const allDevices = this.getDevices().map(device => device.getData());
		let devices = (Object.values(Homey.app.devices) || []).filter(
			device => !allDevices.find(elm => device.data.mac === elm.mac) && device.data.type == Homey.app.deviceType.WBP
		);

		callback(null, devices);
	}
};
