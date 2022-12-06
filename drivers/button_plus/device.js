'use strict';

// const Homey = require("homey");
const ButtonDevice = require('../button/device');

module.exports = class ButtonPlusDevice extends ButtonDevice {

  onInit(options = {}) {
    super.onInit(options);
  }

  initDeviceGenAction(params) {
    super.initDeviceGenAction(params);

    this.homey.on(`deviceGenAction-${this.data.mac}`, async (params) => {
      if (params.action === '5' && params.wheel) {
        this.debug(`deviceGenAction: wheel > ${JSON.stringify(params)}`);
        // Battery-Level
        if (params.battery) {
          await this.setCapabilityValue('measure_battery', parseInt(params.battery, 10));
        }
        // Wheel-Value
        this.driver.triggerWheelChangedFlow(this, { value: parseInt(params.wheel, 10) }, { action: params.action });
      }
    });
  }

};
