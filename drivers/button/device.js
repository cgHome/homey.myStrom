'use strict';

const Device = require('../device');

module.exports = class ButtonDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('button', this.onCapabilityButton.bind(this));
  }

  onAdded() {
    super.onAdded();
    this.subscribeDeviceGenAction();
  }

  subscribeDeviceGenAction() {
    this.homey.cloud.getLocalAddress()
      .then((localAddress) => {
        const value = `get://${localAddress}/api/app/${this.homey.manifest.id}/deviceGenAction`;
        return this.setDeviceData('action/generic', value)
          .then((data) => this.debug(`subscribeDeviceGenAction() > ${data || '[none]'}`));
      })
      .catch((err) => this.error(`subscribeDeviceGenAction() > ${err}`));
  }

  async deviceGenActionReceived(params) {
    super.deviceGenActionReceived(params);

    if (params.action <= '4') {
      this.debug(`deviceGenAction: buttonPressed > ${JSON.stringify(params)}`);
      // Battery-Level
      if (params.battery) {
        await this.setCapabilityValue('measure_battery', parseInt(params.battery, 10));
      }
      // Action
      this.driver.triggerButtonPressedFlow(this, {}, { action: params.action });
    }
  }

  onCapabilityButton(value = true, opts) {
    this.debug(`onCapabilityButton() > ${JSON.stringify(value)}`);
    // Software-Button only supports: "short press"
    this.driver.triggerButtonPressedFlow(this, {}, { action: '1' });
    return Promise.resolve(true);
  }

};
