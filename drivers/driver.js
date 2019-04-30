const Homey = require("homey");
const WebAPIDriver = require("homey-wifidriver").WebAPIDriver;

module.exports = class MyStromDriver extends WebAPIDriver {
	onInit(options = {}) {
		super.onInit(options);

		this.debug("driver init ....");
	}

	// Homey-App Loggers
	log(msg) {
		Homey.app.log(`${this.constructor.name} ${msg}`);
	}

	error(msg) {
		Homey.app.error(`${this.constructor.name} ${msg}`);
	}

	debug(msg) {
		Homey.app.debug(`${this.constructor.name} ${msg}`);
	}
};
