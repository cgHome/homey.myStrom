'use strict';

const Homey = require('homey');
const MyStromDriver = require('../driver');

module.exports = class MyStromSwitchDriver extends MyStromDriver {
    onInit(options) {
        super.onInit(options);
    };

    onPairListDevices(data, callback) {
        let devices = (Object.values(Homey.app.devices) || [])
        .filter((device) => device.data.type == Homey.app.DeviceTypes.WSW);
        
        callback(null, devices);
    };
}