const Homey = require("homey");
const WebAPIDevice = require("homey-wifidriver").WebAPIDevice;

// eslint-disable-next-line no-unused-vars
const backOffStrategy = {
	initialDelay: 10000, // 10 seconds
	maxDelay: 1000 * 60 * 60 // 1 hour
};

module.exports = class MyStromDevice extends WebAPIDevice {
	async onInit(options = {}) {
		await super.onInit(options).catch(err => {
			this.error(`onInit error ${err.stack}`);
			return err;
		});

		this.debug("device init ...");

		const baseUrl = options.baseUrl ? options.baseUrl : `http://${this.getData().address}/api/v1/device/`;
		this.setDefaultBaseUrl(baseUrl);

		this.setUnavailable(Homey.__("connecting"));
		this.ready(() => {
			this.setAvailable();
			this.debug("device ready ...");
		});
	}

	// Homey-App Loggers
	log(msg) {
		Homey.app.log(`${this.getName()} ${msg}`);
	}

	error(msg) {
		Homey.app.error(`${this.getName()} ${msg}`);
	}

	debug(msg) {
		Homey.app.debug(`${this.getName()} ${msg}`);
	}

	registerPollInterval() {
		super.registerPollInterval({
			id: this.getData().deviceName,
			fn: this.getValues.bind(this),
			interval: 5000 // 5 sec
		});
	}

	onAdded() {
		super.onAdded();
		this.debug(`device added (${this.constructor.name})`);
	}

	onDeleted() {
		super.onDeleted();
		this.debug(`device deleted (${this.constructor.name})`);
	}

	getValues() {
		throw new Error("Subclass responsibility");
	}

	apiCallPost(options, data) {
		let _options = typeof options === "object" ? options : {};
		let _data = typeof options === "string" ? options : data;

		if (typeof options === "string" || typeof data === "string") {
			_options["headers"] = {
				"Content-Type": "application/x-www-form-urlencoded"
			};
			if (typeof options === "string") {
				_options["body"] = options;
			} else {
				_options["body"] = data;
			}
		}

		return super.apiCallPost(_options, _data);
	}
};
