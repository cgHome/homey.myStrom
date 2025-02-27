'use strict';

const ButtonDriver = require('../button/driver');

module.exports = class ButtonPlusDriver extends ButtonDriver {

  onInit(options = {}) {
    options.triggerName = 'button_plus_pressed';
    super.onInit(options);

    this._flowTriggerWheelChanged = this.homey.flow
      .getDeviceTriggerCard('button_plus_wheel')
      .registerRunListener(Promise.resolve(true));
  }

  async onPairListDevices() {
    // see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
    return (Object.values(this.homey.app.devices) || [])
      .filter((device) => device.data.type === 103);
  }

  triggerWheelChangedFlow(device, tokens, state) {
    this._flowTriggerWheelChanged
      .trigger(device, tokens, state)
      .then(() => this.logInfo(`${device.getName()} [${this.getActionLabel(state.action)}] wheel changed to: ${tokens.value}`))
      .catch((err) => this.logError(`triggerWheelChangedFlow() > ${err}`));
  }

  getActionLabel(action) {
    const label = super.getActionLabel(action);
    return label !== 'unknown' ? label : action === '4' ? 'Touch' : action === '5' ? 'Wheel' : action === '11' ? 'Wheel final' : 'unknown';
  }

};
