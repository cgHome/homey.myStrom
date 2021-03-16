"use strict";

// const Homey = require("homey");
const ButtonDevice = require("../button/device");

module.exports = class ButtonPlusDevice extends ButtonDevice {
  onInit(options = {}) {
    super.onInit(options);

    this.log("ButtonPlusDevice initiated");
  }

  async deviceActionReceived(params) {
    super.deviceActionReceived(params);

    if (params.action === "5" && params.wheel) {
      this.debug(`deviceActionReceived() - wheel > ${JSON.stringify(params)}`);
      // Battery-Level
      if (params.battery) {
        await this.setCapabilityValue("measure_battery", parseInt(params.battery, 10));
      }
      // Wheel-Value
      this.getDriver().triggerWheelChanged(this, {}, { action: params.action, value: parseInt(params.wheel, 10) });
    }
  }
};
