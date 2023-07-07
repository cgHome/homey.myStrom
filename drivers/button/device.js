'use strict';

const BaseDevice = require('../device');

module.exports = class ButtonDevice extends BaseDevice {

  onInit() {
    super.onInit();

    this.registerCapabilityListener('button', this.onCapabilityButton.bind(this));
  }

  onAdded() {
    super.onAdded();
    this.subscribeDeviceGenAction();
  }

  initDevice() {
    super.initDevice()
      .then(() => this.subscribeDeviceGenAction())
      .catch((err) => this.logError(`initDevice() > ${err}`));
  }

  subscribeDeviceGenAction() {
    this.homey.cloud.getLocalAddress()
      .then((localAddress) => {
        const value = `get://${localAddress}/api/app/${this.homey.manifest.id}/deviceGenAction`;
        return this.setDeviceData('action/generic', value)
          .then((data) => this.logDebug(`subscribeDeviceGenAction() > ${data || '[none]'}`));
      })
      .catch((err) => {
        this.setAvailable();
        this.logError(`subscribeDeviceGenAction() > ${err}`);
      });
  }

  async deviceGenActionReceived(params) {
    super.deviceGenActionReceived(params);

    if (params.action <= '4') {
      this.logDebug(`deviceGenAction: buttonPressed > ${JSON.stringify(params)}`);
      // Battery-Level
      if (params.battery) {
        await this.setCapabilityValue('measure_battery', parseInt(params.battery, 10));
      }
      // Action
      this.driver.triggerButtonPressedFlow(this, {}, { action: params.action });
    }
  }

  // Data handling

  getDeviceValues() {
    return Promise.resolve();
  }

  onCapabilityButton(value = true, opts) {
    this.logDebug(`onCapabilityButton() > ${JSON.stringify(value)}`);
    // Software-Button only supports: "short press"
    this.driver.triggerButtonPressedFlow(this, {}, { action: '1' });
    return Promise.resolve(true);
  }

};
