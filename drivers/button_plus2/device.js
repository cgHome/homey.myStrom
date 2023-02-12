'use strict';

const Device = require('../device');

module.exports = class ButtonPlus2Device extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener('button', this.onCapabilityButton.bind(this));
  }

  onAdded() {
    super.onAdded();
    this.subscribeDeviceGenAction();
  }

  initDevice() {
    super.initDevice()
      .then(this.subscribeDeviceGenAction())
      .catch((err) => this.error(`initDevice() > ${err}`));
  }

  subscribeDeviceGenAction() {
    this.homey.cloud.getLocalAddress()
      .then((localAddress) => {
        const value = `get://${localAddress}/api/app/${this.homey.manifest.id}/deviceGenAction`;
        return this.setDeviceData('action/generic/generic', value)
          .then((data) => this.debug(`subscribeDeviceGenAction() > ${data || '[none]'}`));
      })
      .catch((err) => this.error(`subscribeDeviceGenAction() > ${err}`));
  }

  async deviceGenActionReceived(params) {
    super.deviceGenActionReceived(params);

    switch (params.index) {
      case '0': // generic/generic
        if (params.action === '6') {
          this.debug(`deviceGenAction: periodicallyReports > ${JSON.stringify(params)}`);
          this.setCapabilityValue('measure_temperature', parseInt(params.temp, 10));
          this.setCapabilityValue('measure_humidity', parseInt(params.rh, 10));
          this.setCapabilityValue('measure_battery', parseInt(params.bat, 10));
        }
        break;
      case '1': // button-X
      case '2':
      case '3':
      case '4':
        if (params.action <= '3') {
          this.debug(`deviceGenAction: buttonPressed > ${JSON.stringify(params)}`);
          this.setCapabilityValue('measure_temperature', parseInt(params.temp, 10));
          this.setCapabilityValue('measure_humidity', parseInt(params.rh, 10));
          this.setCapabilityValue('measure_battery', parseInt(params.bat, 10));
          this.driver.triggerButtonPressedFlow(this, {}, { button: params.index, action: params.action });
        }
        break;
      case '6': // battery
        this.debug(`deviceGenAction: battery > ${JSON.stringify(params)}`);
        this.setCapabilityValue('measure_battery', parseInt(params.bat, 10));
        break;
      default:
        this.debug(`deviceGenAction: notUsed > ${JSON.stringify(params)}`);
        break;
    }
  }

  onCapabilityButton(value = true, opts) {
    this.debug(`onCapabilityButton() > ${JSON.stringify(value)}`);
    // Software-Button only supports: "short press"
    this.driver.triggerButtonPressedFlow(this, {}, { action: '1' });
    return Promise.resolve(true);
  }

};
