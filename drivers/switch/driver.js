const Homey = require("homey");
const MyStromDriver = require("../driver");

module.exports = class MyStromSwitchDriver extends MyStromDriver {
	onInit(options) {
		super.onInit(options);
	}

	onPairListDevices(data, callback) {
		const allDevices = this.getDevices().map(device => device.getData());
		let devices = (Object.values(Homey.app.devices) || []).filter(
			device =>
				!allDevices.find(elm => device.data.mac === elm.mac) && 
				device.data.type === Homey.app.deviceType.WSW ||
				device.data.type === Homey.app.deviceType.WS2
		);

		callback(null, devices);
	}
};
