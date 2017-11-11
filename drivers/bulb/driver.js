'use strict';

const Homey = require('homey');
const WebAPIDriver = require('homey-wifidriver').WebAPIDriver;

module.exports = class MyStromSwitchDriver extends WebAPIDriver {
    onInit(options) {
        super.onInit(options);

        this.log('Driver onInit ....');
    };

    onPairListDevices(data, callback) {
        let devices = (Object.values(Homey.app.devices) || [])
            .filter((device) => device.data.type == Homey.app.DeviceTypes.WRB);

        callback(null, devices);
    }
}