'use strict';

const Homey = require('homey');
//const Log = require('homey-log').Log;
const WifiApp = require('homey-wifidriver').WifiApp;
const dns = require('dns');
const dgram = require('dgram');
const bonjour = require('bonjour')();

// Start Node.js debugger
// require('inspector').open(9229, '0.0.0.0', true);

module.exports = class MyStromApp extends WifiApp {
	constructor(...args) {
		super(...args);

		this.devices = {};
		this.DeviceTypes = Object.freeze({
			WSW: 101,		// WiFi Switch
			WRB: 102,		// WiFi Bulb
			WBP: 103,		// WiFi ??		
			WBS: 104,		// WiFi ??
			WRS: 105,		// WiFi ??
			WS2: 106,		// WiFi ??
			WSE: 107		// WiFi ??
		});
	};

	onInit() {
		const browser = bonjour.find({ type: 'hap' }, (service) => {
			if (service.host.match('myStrom-')) {
				const deviceName = service.host.slice(0, service.host.indexOf('.'));
				const mac = service.txt.id.replace(new RegExp(':', 'g'), '').toUpperCase();
				const device = {
					"name": deviceName,
					"data": {
						"id": mac,
						"type": this.DeviceTypes.WSW,
						"host": service.host,
						"address": service.referer.address,
						"deviceName": deviceName
					}
				};
				this.devices[mac] = device;
				this.log(`Bonjour discovered device found: ${device.data.deviceName} - ${device.data.address}`);
			};
		});
		browser.start();

		const udpClient = dgram.createSocket('udp4', (msg, rinfo) => {
			dns.reverse(rinfo.address, (err, hostnames) => {
				if (!err) {
					const hostname = hostnames[0];
					const deviceName = hostname.slice(0, hostname.indexOf('.'));
					const mac = msg.hexSlice(0, 6).toUpperCase();
					const device = {
						"name": deviceName,
						"data": {
							"id": mac,
							"type": msg[6],
							"host": hostname,
							"address": rinfo.address,
							"deviceName": deviceName
						}
					};
					if (!this.devices[mac]) {
						this.devices[mac] = device;
						this.log(`UDP discovered device found: ${device.data.deviceName} - ${device.data.address}`);
					};
				}
				else {
					this.error(`UDP discovery failed: ${err.code} - ${err.message}`)
				};
			});
		});
		udpClient.bind(7979);

		this.log(`${this.id} is running...`);
	}
};
