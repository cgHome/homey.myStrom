'use strict';

const Driver = require('../driver');

module.exports = class ButtonDriver extends Driver {

  onInit(options = {}) {
    super.onInit(options);

    // Initialize Flow
    this._flowTriggerButtonPressed = this.homey.flow
      .getDeviceTriggerCard(options.triggerName ? options.triggerName : 'button_pressed')
      .registerRunListener(async (args, state) => {
        return args.action === state.action;
      });

    this.log('Driver initiated');
  }

  async onPairListDevices() {
    const devices = (Object.values(this.homey.app.devices) || []).filter(
      (device) => device.data.type === this.homey.app.deviceType.WBS,
    );

    return devices;
  }

  triggerButtonPressedFlow(device, tokens, state) {
    this._flowTriggerButtonPressed
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} [${this.getActionLabel(state.action)}] button pressed`))
      .catch((err) => this.error(`triggerButtonPressedFlow() > ${err}`));
  }

  getActionLabel(action) {
    // eslint-disable-next-line no-nested-ternary
    return action === '1' ? 'short' : action === '2' ? 'double' : action === '3' ? 'long' : 'unknown';
  }

};
