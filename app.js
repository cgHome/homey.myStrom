"use strict";
// Start debuger
if (process.env.DEBUG === "1") {
	require("inspector").open(9229, "0.0.0.0", false);
	// require("inspector").open(9229, "0.0.0.0", true);
}

const Homey = require("homey");
const WifiApp = require("homey-wifidriver").WifiApp;
const dns = require("dns");
const dgram = require("dgram");
const bonjour = require("bonjour")();

module.exports = class MyStromApp extends WifiApp {
	constructor(...args) {
		super(...args);

		this.devices = {};
		this.DeviceTypes = Object.freeze({
			WSW: 101, // WiFi Switch CH v1
			WRB: 102, // WiFi Bulb
			WBP: 103, // WiFi Button +
			WBS: 104, // WiFi Button
			WLS: 105, // WiFi LED-strip
			WS2: 106, // WiFi Switch CH v2
			WSE: 107 // WiFi Switch EU
		});
	}

	onInit() {
		// Initialize Homey-App Loggers
		this.appLogListener = new Homey.FlowCardTrigger("app_log_listener");
		this.appLogListener.register().registerRunListener(Promise.resolve(true));

		this.appErrorListener = new Homey.FlowCardTrigger("app_error_listener");
		this.appErrorListener.register().registerRunListener(Promise.resolve(true));

		this.appDebugListener = new Homey.FlowCardTrigger("app_debug_listener");
		this.appDebugListener.register().registerRunListener(Promise.resolve(true));

		this.log(`${Homey.app.manifest.name.en}-App - v${Homey.app.manifest.version} is running...`);

		// Find myStrom-Devices
		const browser = bonjour.find({ type: "hap" }, service => {
			if (service.host.match("myStrom-")) {
				const deviceName = service.host.slice(0, service.host.indexOf("."));
				const mac = service.txt.id.replace(new RegExp(":", "g"), "").toUpperCase();
				const device = {
					name: deviceName,
					data: {
						id: mac,
						type: this.DeviceTypes.WSW,
						host: service.host,
						address: service.referer.address,
						deviceName: deviceName
					}
				};
				this.devices[mac] = device;
				this.log(`Bonjour discovered device ${device.data.deviceName} found ${device.data.address} (${mac}) - (Type: ${device.data.type})`);
			}
		});
		browser.start();

		const udpClient = dgram.createSocket("udp4", (msg, rinfo) => {
			dns.reverse(rinfo.address, (err, hostnames) => {
				if (!err) {
					const hostname = hostnames[0];
					const deviceName = hostname.slice(0, hostname.indexOf("."));
					const mac = msg.hexSlice(0, 6).toUpperCase();
					const device = {
						name: deviceName,
						data: {
							id: mac,
							type: msg[6],
							host: hostname,
							address: rinfo.address,
							deviceName: deviceName
						}
					};
					if (!this.devices[mac]) {
						this.devices[mac] = device;
						this.log(`UDP discovered device ${device.data.deviceName} found ${device.data.address} (${mac}) - (Type: ${device.data.type})`);
					}
				} else {
					this.error(`UDP discovery failed ${err.code} - ${err.message}`);
				}
			});
		});
		udpClient.bind(7979);
	}

	// Homey-App Loggers
	log(msg) {
		super.log(msg);
		// Send to logger
		if (this.appLogListener) {
			this.appLogListener.trigger({ name: `${Homey.app.manifest.name.en}`, msg: msg }).catch(err => super.error(err.message));
		}
	}

	error(msg) {
		super.error(`### ${msg}`);
		// Send to error logger
		if (this.appErrorListener) {
			this.appErrorListener.trigger({ name: `${Homey.app.manifest.name.en}`, msg: msg }).catch(err => super.error(err.message));
		}
	}

	debug(msg) {
		super.log(`»»» ${msg}`);
		// Send to debug logger
		if (this.appDebugListener) {
			this.appDebugListener.trigger({ name: `${Homey.app.manifest.name.en}`, msg: msg }).catch(err => super.error(err.message));
		}
	}
};
