'use strict';

const Homey = require('homey');
const WebAPIDriver = require('homey-wifidriver').WebAPIDriver;

module.exports = class MyStromSwitchDriver extends WebAPIDriver {
    onInit(options) {
        super.onInit(options);

        this.log('Driver onInit ....');
    };

    onPairListDevices(data, callback) {

        let devices = (Homey.app.devices || [])
            .filter(device => device.data.host.match('myStrom-Switch-'));

        callback(null, devices);
    }
}