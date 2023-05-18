'use strict';

const BaseDriver = require('../driver');

module.exports = class SwitchDriver extends BaseDriver {

  onInit() {
    super.onInit();
  }

  async onPairListDevices() {
    // see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
    return (Object.values(this.homey.app.devices) || [])
      .filter((device) => device.data.type === 101 || device.data.type === 106 || device.data.type === 107 || device.data.type === 120);
  }

};
