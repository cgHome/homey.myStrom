'use strict';

const Homey = require('homey');
//const Log = require('homey-log').Log;
const WifiApp = require('homey-wifidriver').WifiApp;
const bonjour = require('bonjour')();

// Start Node.js debugger
// require('inspector').open(9229, '0.0.0.0', true);

module.exports = class MyStromApp extends WifiApp {
	onInit() {
		this.devices = [];

		const browser = bonjour.find({ type: 'hap' }, (service) => {
			if (service.host.match('myStrom-')) {
				let device = {
					"name": service.name,
					"data": {
						"id": service.txt.id.replace(new RegExp(':', 'g'), '').toUpperCase(),
						"host": service.host,
						"address": service.referer.address
					}
				};
				// console.log('Device found:', device);
				this.devices.push(device);
			}
		});
		browser.start();

		this.log(`${this.id} is running...`);
	}
};
