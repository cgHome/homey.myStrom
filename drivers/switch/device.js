'use strict';

const BaseDevice = require('../device');

module.exports = class SwitchDevice extends BaseDevice {

  async onInit() {
    super.onInit();

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));

    switch (this.data.type) {
      case 101: // Switch CH v1
        if (this.hasCapability('measure_temperature')) {
          await this.removeCapability('measure_temperature')
            .then(this.logDebug('onInit() > Switch CH v1 > measure_temperature removed'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        break;
      case 120: // Switch Zero
        if (this.hasCapability('measure_power')) {
          await this.removeCapability('measure_power')
            .then(this.logDebug('onInit() > Switch Zero > measure_power removed'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        if (this.hasCapability('measure_temperature')) {
          await this.removeCapability('measure_temperature')
            .then(this.logDebug('onInit() > Switch Zero > measure_temperature removed'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        break;
      default:
        break;
    }
  }

  initDevice() {
    super.initDevice()
      .then(this.getDeviceValues())
      .then(this.initDeviceRefresh())
      .catch((err) => this.logError(`initDevice() > ${err}`));
  }

  getDeviceValues(url = 'report') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('onoff', data.relay);
        if (data.power) {
          this.setCapabilityValue('measure_power', Math.round(data.power * 10) / 10);
        }
        if (data.temperature) {
          this.setCapabilityValue('measure_temperature', Math.round(data.temperature * 10) / 10);
        }
      })
      .catch((err) => this.logError(`getDeviceValues() > ${err.message}`));
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve(true);

    this.logDebug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`relay?state=${value ? '1' : '0'}`)
      .then(this.getDeviceValues())
      .then(this.deviceChanged(() => {
        const current = this.getCapabilityValue('onoff');
        return this.homey.__('device.stateSet', { value: current ? 'on' : 'off' });
      }))
      .catch((err) => this.logError(`onCapabilityOnOff() > ${err}`));
  }

  setDeviceData(...args) {
    // ATTENTION: switch uses http-get to set values
    return this.getDeviceData(...args);
  }

};
