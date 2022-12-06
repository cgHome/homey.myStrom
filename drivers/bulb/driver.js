'use strict';

const Driver = require('../driver');

module.exports = class BulbDriver extends Driver {

  onInit(options = {}) {
    super.onInit(options);
  }

  async onPairListDevices() {
    // see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
    return (Object.values(this.homey.app.devices) || [])
      .filter((device) => device.data.type === 102);
  }

};
