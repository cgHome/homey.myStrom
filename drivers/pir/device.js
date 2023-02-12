'use strict';

const Device = require('../device');

const MOTION_START = '8';
const MOTION_STOP = '9';
const MOTION_NIGHT = '14';
const MOTION_TWILIGHT = '15';
const MOTION_DAY = '16';

module.exports = class PirDevice extends Device {

  onInit(options = {}) {
    super.onInit(options);
  }

  initDevice() {
    super.initDevice()
      .then(this.subscribeDeviceGenAction())
      .then(this.getDeviceValues())
      .catch((err) => this.error(`initDevice() > ${err}`));
  }

  subscribeDeviceGenAction() {
    this.homey.cloud.getLocalAddress()
      .then((localAddress) => {
        const value = `get://${localAddress}/api/app/${this.homey.manifest.id}/deviceGenAction`;
        return this.setDeviceData('action/pir/generic', value)
          .then((data) => this.debug(`subscribeDeviceGenAction() > ${data || '[none]'}`));
      })
      .catch((err) => this.error(`subscribeDeviceGenAction() > ${err}`));
  }

  deviceGenActionReceived(params) {
    super.deviceGenActionReceived(params);

    switch (params.action) {
      case MOTION_START:
        this.debug('deviceGenActionReceived() > motion start');
        this.setCapabilityValue('alarm_motion', true);
        break;
      case MOTION_STOP:
        this.debug('deviceGenActionReceived() > motion stop');
        this.setCapabilityValue('alarm_motion', false);
        break;
      case MOTION_DAY:
      case MOTION_TWILIGHT:
      case MOTION_NIGHT:
        this.setLightState(this.convertMotionMode(params.action));
        break;
      default:
    }
  }

  getDeviceValues(url = 'sensors') {
    return super.getDeviceValues(url)
      .then((data) => {
        this.setCapabilityValue('alarm_motion', data.motion);
        if (data.light) {
          this.setCapabilityValue('measure_luminance', data.light);
        }
        if (data.temperature) {
          this.setCapabilityValue('measure_temperature', Math.round(data.temperature * 10) / 10);
        }
      })
      .catch((err) => this.error(`getDeviceValues() > ${err.message}`));
  }

  setLightState(state) {
    if (state !== this.getCapabilityValue('light_state')) {
      this.debug(`setLightState() > ${state}`);
      this.setCapabilityValue('light_state', state)
        .then(this.driver.triggerLightStateChangedFlow(this, {}, { lightState: state }))
        .catch((err) => this.error(`setLightState() - ${err}`));
    }
  }

  convertMotionMode(mode) {
    switch (mode) {
      case MOTION_DAY:
        return 'day';
      case MOTION_TWILIGHT:
        return 'twilight';
      case MOTION_NIGHT:
        return 'night';
      default:
        return `[${mode}]`;
    }
  }

};