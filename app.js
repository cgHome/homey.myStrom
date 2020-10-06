"use strict";
// Start debuger
if (process.env.DEBUG === "1") {
	//require("inspector").open(9229, "0.0.0.0", false);
	require("inspector").open(9229, "0.0.0.0", true);
}

const Homey = require("homey");
const dns = require("dns");
const dgram = require("dgram");
const bonjour = require("bonjour")();

module.exports = class MyStromApp extends Homey.App {
	constructor(...args) {
		super(...args);

		this.devices = {};
		this.deviceType = Object.freeze({
			WSW: 101, // WiFi Switch CH v1
			WRB: 102, // WiFi Bulb
			WBP: 103, // WiFi Button +
			WBS: 104, // WiFi Button
			WLS: 105, // WiFi LED-strip
			WS2: 106, // WiFi Switch CH v2
			WSE: 107, // WiFi Switch EU
		});
	}

	onInit() {
		this.log(`${Homey.app.manifest.name.en}-App - v${Homey.app.manifest.version} is running...`);

		// Find myStrom-Devices
		const browser = bonjour.find({ type: "hap" }, (service) => {
			if (service.host.match("myStrom-Switch")) {
				const deviceName = service.host.slice(0, service.host.indexOf("."));
				const mac = service.txt.id.replace(new RegExp(":", "g"), "").toUpperCase();
				const device = {
					name: deviceName,
					data: {
						id: mac,
						mac: mac,
						deviceName: deviceName,
						host: service.host,
						address: service.referer.address,
						type: mac.match("64002D") ? this.deviceType.WSW : this.deviceType.WS2,
					},
				};
				this.devices[mac] = device;
				Homey.emit("deviceDiscovered", {
					name: device.data.deviceName,
					address: device.data.address,
					mac,
				});
				this.log(
					`Bonjour discovered device ${device.data.deviceName} found ${device.data.address} (${mac}) - (Type: ${device.data.type})`
				);
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
							mac: mac,
							deviceName: deviceName,
							host: hostname,
							address: rinfo.address,
							type: msg[6],
						},
					};
					if (!this.devices[mac]) {
						this.devices[mac] = device;
						Homey.emit("deviceDiscovered", {
							name: device.data.deviceName,
							address: device.data.address,
							mac,
						});
						this.log(
							`UDP discovered device ${device.data.deviceName} found ${device.data.address} (${mac}) - (Type: ${device.data.type})`
						);
					}
				} else {
					// this.error(`UDP discovery failed ${err.code} - ${err.message}`);
				}
			});
		});
		udpClient.bind(7979);
	}

	isDebugMode() {
		return process.env.DEBUG === "1";
	}

	// Homey-App Loggers
	log(msg) {
		super.log(msg);
	}
	error(msg) {
		super.error(`${msg}`);
	}
	debug(msg) {
		if (this.isDebugMode()) {
			super.log(`»»» ${msg}`);
		}
	}
};
