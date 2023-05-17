'use strict';

const BaseDriver = require('../driver');

module.exports = class ButtonDriver extends BaseDriver {

  onInit(options = {}) {
    super.onInit(options);

    // Initialize Flow
    this._flowTriggerButtonPressed = this.homey.flow
      .getDeviceTriggerCard(options.triggerName ? options.triggerName : 'buttonPlus_pressed')
      .registerRunListener(async (args, state) => {
        return args.button === state.button && args.action === state.action;
      });
  }

  async onPairListDevices() {
    // see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
    return (Object.values(this.homey.app.devices) || [])
      .filter((device) => device.data.type === 118);
  }

  triggerButtonPressedFlow(device, tokens, state) {
    this._flowTriggerButtonPressed
      .trigger(device, tokens, state)
      .then(this.logInfo(`${device.getName()} button-${state.button} [${this.getActionLabel(state.action)}] pressed`))
      .catch((err) => this.logError(`triggerButtonPressedFlow() > ${err}`));
  }

  getActionLabel(action) {
    // eslint-disable-next-line no-nested-ternary
    return action === '1' ? 'short' : action === '2' ? 'double' : action === '3' ? 'long' : 'unknown';
  }

};
