'use strict';

const Homey = require('homey');
const WebAPIDriver = require('homey-wifidriver').WebAPIDriver;

module.exports = class MyStromButtonDriver extends WebAPIDriver {
    onInit(options) {
        super.onInit(options);

        this.log('Driver onInit ....');

        // Initialize Flow
        this.flowCardTrigger = new Homey.FlowCardTriggerDevice('button_pressed')
            .register()
            .registerRunListener((args, state) => args.button === state.button);
    };

    onPairListDevices(data, callback) {
        let devices = (Object.values(Homey.app.devices) || [])
            .filter((device) => device.data.type == Homey.app.DeviceTypes.WBS);

        callback(null, devices);
    }
}