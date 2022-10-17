'use strict';

const Driver = require('../driver');

module.exports = class SwitchDriver extends Driver {

  onInit(options) {
    super.onInit(options);
    this.log('Driver initiated');
  }

  async onPairListDevices() {
    const devices = (Object.values(this.homey.app.devices) || []).filter(
      (device) => device.data.type === this.homey.app.deviceType.WSW || device.data.type === this.homey.app.deviceType.WS2,
    );

    return devices;
  }

};
