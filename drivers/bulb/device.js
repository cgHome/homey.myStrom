'use strict';

const querystring = require('querystring');
const Device = require('../device');

const RAMP_DEFAULT = '0';

module.exports = class BulbDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);

    this.bulpMode = null; // Current mode

    this.registerCapabilityListener('onoff', this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
    this.registerCapabilityListener('light_temperature', this.onCapabilityLightTemperature.bind(this));
    this.registerMultipleCapabilityListener(['light_hue', 'light_saturation'], this.onCapabilityLightHueSaturation.bind(this));
  }

  async initDevice() {
    super.initDevice()
      .then(this.getDeviceValues())
      .then(this.initDeviceRefresh())
      .catch((err) => this.logError(`initDevice() > ${err}`));
  }

  getDeviceValues(url = 'device') {
    return super.getDeviceValues(url)
      .then((data) => {
        const result = data[Object.keys(data)[0]];
        this.setCapabilityValue('onoff', result.on);
        this.setCapabilityValue('measure_power', Math.round(result.power * 10) / 10);
        this.bulpMode = result.mode;
        if (this.bulpMode === 'mono') {
          this.setCapabilityValue('light_temperature', Math.round((1 / 13) * (14 - parseInt(result.color.split(';')[0], 10)) * 100) / 100);
          this.setCapabilityValue('dim', parseInt(result.color.split(';')[1], 10) / 100);
        } else {
          this.setCapabilityValue('light_hue', Math.round((1 / 360) * parseInt(result.color.split(';')[0], 10) * 100) / 100);
          this.setCapabilityValue('light_saturation', parseInt(result.color.split(';')[1], 10) / 100);
          this.setCapabilityValue('dim', parseInt(result.color.split(';')[2], 10) / 100);
        }
        return data;
      })
      .catch((err) => this.logError(`getDeviceValues() > ${err.message}`));
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue('onoff');
    if (current === value) return Promise.resolve(true);

    this.logDebug(`onCapabilityOnOff() - ${current} > ${value}`);

    const action = value ? 'on' : 'off';

    return this.setDeviceData('device', { action, ramp: RAMP_DEFAULT })
      .then(this.getDeviceValues())
      .then(this.notify(() => {
        const current = this.getCapabilityValue('onoff');
        return this.homey.__('device.stateSet', { value: current ? 'on' : 'off' });
      }))
      .catch((err) => this.logError(`onCapabilityOnOff() > ${err}`));
  }

  async onCapabilityDim(value, opts) {
    const current = this.getCapabilityValue('dim');
    if (current === value) return Promise.resolve(true);

    this.logDebug(`onCapabilityDim() - ${current} > ${value}`);

    const action = value >= 0.01 ? 'on' : 'off';
    const dim = Math.round(value * 100);

    let color;
    if (this.bulpMode === 'mono') {
      const lightTemperature = 14 - Math.round(this.getCapabilityValue('light_temperature') * 13);
      color = `${lightTemperature};${dim}`;
    } else {
      const lightHue = Math.round(this.getCapabilityValue('light_hue') * 360);
      const lightSaturation = Math.round(this.getCapabilityValue('light_saturation') * 100);
      color = `${lightHue};${lightSaturation};${dim}`;
    }

    return this.setDeviceData('device', {
      action, ramp: RAMP_DEFAULT, mode: this.bulpMode, color,
    })
      .then(this.getDeviceValues())
      .then(this.notify(() => {
        const current = this.getCapabilityValue('dim');
        return this.homey.__('device.dimSet', { value: Math.round(current * 100) });
      }))
      .catch((err) => this.logError(`onCapabilityDim() > ${err}`));
  }

  async onCapabilityLightTemperature(value, opts) {
    const current = this.getCapabilityValue('light_temperature');
    if (current === value) return Promise.resolve(true);

    this.logDebug(`onCapabilityLightTemperature() - ${current} > ${value}`);

    const lightTemperature = 14 - Math.round(value * 13);
    const dim = Math.round(this.getCapabilityValue('dim') * 100);
    const color = `${lightTemperature};${dim}`;

    return this.setDeviceData('device', {
      action: 'on', mode: 'mono', ramp: RAMP_DEFAULT, color,
    })
      .then(this.getDeviceValues())
      .then(this.notify(() => {
        const current = this.getCapabilityValue('light_temperature');
        return this.homey.__('device.lightTemperatureSet', { value: current });
      }))
      .catch((err) => this.logError(`onCapabilityLightTemperature() > ${err}`));
  }

  async onCapabilityLightHueSaturation(values, opts) {
    const curHue = this.getCapabilityValue('light_hue');
    const valHue = values.light_hue || curHue;
    const curSaturation = this.getCapabilityValue('light_saturation');
    const valSaturation = values.saturation || curSaturation;

    if (!(curHue !== valHue || curSaturation !== valSaturation)) return Promise.resolve(true);

    this.logDebug(`onCapabilityLightHueSaturation() light_hue - ${curHue} > ${valHue}`);
    this.logDebug(`onCapabilityLightHueSaturation() light_saturation - ${curSaturation} > ${valSaturation}`);

    const hue = Math.round(valHue * 360);
    const saturation = Math.round(valSaturation * 100);
    const dim = Math.round(this.getCapabilityValue('dim') * 100);
    const color = `${hue};${saturation};${dim}`;

    return this.setDeviceData('device', {
      action: 'on', mode: 'hsv', ramp: RAMP_DEFAULT, color,
    })
      .then(this.getDeviceValues())
      .then(this.notify(() => {
        const hue = Math.round(this.getCapabilityValue('light_hue') * 360);
        const saturation = Math.round(this.getCapabilityValue('light_saturation') * 100);
        return this.homey.__('device.lightHueSetSaturation', { hue, saturation });
      }))
      .catch((err) => this.logError(`onCapabilityLightHue() > ${err}`));
  }

  setDeviceData(url, data) {
    url = `${url}/${this.data.id}`;
    const qString = querystring.stringify(data).split('%3B').join(';');
    return super.setDeviceData(url, qString);
  }

};
