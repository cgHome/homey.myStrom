const Homey = require("homey");
const MyStromButtonDriver = require("../button/driver");

module.exports = class MyStromButtonPlusDriver extends MyStromButtonDriver {
	onInit(options = {}) {
		options.flowCardTriggerName = "button_plus_pressed";

		super.onInit(options);
	}

	onPairListDevices(data, callback) {
		let devices = (Object.values(Homey.app.devices) || []).filter(
			device => device.data.type == Homey.app.DeviceTypes.WBP
		);

		callback(null, devices);
	}
};
