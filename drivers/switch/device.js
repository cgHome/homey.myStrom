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
            .then(() => this.logDebug('onInit() > Switch CH v1 > measure_temperature removed'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        break;
      case 120: // Switch Zero
        if (this.hasCapability('measure_power')) {
          await this.removeCapability('measure_power')
            .then(() => this.logDebug('onInit() > Switch Zero > measure_power removed'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        if (this.hasCapability('measure_temperature')) {
          await this.removeCapability('measure_temperature')
            .then(() => this.logDebug('onInit() > Switch Zero > measure_temperature removed'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        break;
      default:
        if (!this.hasCapability('meter_power')) {
          await this.addCapability('meter_power')
            .then(() => this.logDebug('onInit() > Switch > meter_power added'))
            .catch((err) => this.logError(`onInit() - ${err}`));
        }
        // this.unsetStoreValue('energy'); // NOTE: Only for test
        if (!this.getStoreValue('energy')) {
          await this.setStoreValue('energy', {
            current_boot_id: '',
            begin_total_energy: 0,
            total_energy: 0,
          });
        }
        break;
    }
  }

  initDevice() {
    super.initDevice()
      .then(() => this.initDeviceRefresh())
      .catch((err) => this.logError(`initDevice() > ${err}`));
  }

  // MyHttpDevice

  getBaseURL() {
    return `http://${this.getStoreValue('address')}/`;
  }

  getDeviceValues(url = 'report') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('onoff', data.relay);
        if ('energy_since_boot' in data) {
          const energy = this.getStoreValue('energy');
          if (energy.current_boot_id !== data.boot_id) {
            energy.begin_total_energy = energy.total_energy;
            energy.current_boot_id = data.boot_id;
          }
          energy.total_energy = energy.begin_total_energy + data.energy_since_boot;
          this.setStoreValue('energy', energy);

          this.setCapabilityValue('meter_power', parseFloat((energy.total_energy / 3600000).toFixed(2))); // Convert > Ws (watt second) to kWh
        }
        if ('power' in data) {
          this.setCapabilityValue('measure_power', parseFloat(data.power.toFixed(1)));
        }
        if ('temperature' in data) {
          this.setCapabilityValue('measure_temperature', parseFloat(data.temperature.toFixed(1)));
        }
      })
      .catch((err) => this.logError(`getDeviceValues() > ${err.message}`));
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve(true);

    this.logDebug(`onCapabilityOnOff() - ${current} > ${value}`);

    return this.setDeviceData(`relay?state=${value ? '1' : '0'}`)
      .then(() => this.getDeviceValues())
      .then(() => this.deviceChanged(() => {
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
