'use strict';

const Device = require('../device');

module.exports = class SwitchDevice extends Device {

  onInit(options = {}) {
    options.baseURL = options.baseURL || `http://${this.getStoreValue('address')}/`;
    super.onInit(options);

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
  }

  initDevice() {
    super.initDevice()
      .then(this.getDeviceValues())
      .then(this.initDeviceRefresh())
      .catch((err) => this.error(`initDevice() > ${err}`));
  }

  async getDeviceValues(url = 'report') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('onoff', data.relay);
        this.setCapabilityValue('measure_power', Math.round(data.power * 10) / 10);
        if (data.temperature) {
          this.setCapabilityValue('measure_temperature', Math.round(data.temperature * 10) / 10);
        }
      })
      .catch((err) => this.error(`getDeviceValues() > ${err.message}`));
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`relay?state=${value ? '1' : '0'}`)
      .then(this.getDeviceValues())
      .then(this.notify(() => {
        const current = this.getCapabilityValue('onoff');
        return this.homey.__('device.stateSet', { value: current ? 'on' : 'off' });
      }))
      .catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
  }

  setDeviceData(...args) {
    // ATTENTION: switch uses http-get to set values
    return this.getDeviceData(...args);
  }

};
