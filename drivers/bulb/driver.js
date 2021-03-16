"use strict";

const Homey = require("homey");
const Driver = require("../driver");

module.exports = class BulbDriver extends Driver {
  onInit(options = {}) {
    super.onInit(options);
  }

  onPairListDevices(data, callback) {
    const devices = (Object.values(Homey.app.devices) || []).filter(
      (device) => device.data.type === Homey.app.deviceType.WRB
    );

    callback(null, devices);
  }
};
