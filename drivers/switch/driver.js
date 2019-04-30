const Homey = require("homey");
const MyStromDriver = require("../driver");

module.exports = class MyStromSwitchDriver extends MyStromDriver {
	onInit(options) {
		super.onInit(options);
	}

	onPairListDevices(data, callback) {
		let devices = (Object.values(Homey.app.devices) || []).filter(
			device => device.data.type == Homey.app.DeviceTypes.WSW || device.data.type == Homey.app.DeviceTypes.WS2
		);

		callback(null, devices);
	}
};
