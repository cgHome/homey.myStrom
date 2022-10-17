'use strict';

const ButtonDriver = require('../button/driver');

module.exports = class ButtonPlusDriver extends ButtonDriver {

  onInit(options = {}) {
    options.triggerName = 'button_plus_pressed';
    super.onInit(options);

    this._flowTriggerWheelChanged = this.homey.flow
      .getDeviceTriggerCard('button_plus_wheel')
      .registerRunListener(Promise.resolve(true));

    this.log('Driver initiated');
  }

  async onPairListDevices() {
    const devices = (Object.values(this.homey.app.devices) || []).filter(
      (device) => device.data.type === this.homey.app.deviceType.WBP,
    );

    return devices;
  }

  triggerWheelChangedFlow(device, tokens, state) {
    this._flowTriggerWheelChanged
      .trigger(device, tokens, state)
      .then(this.log(`${device.getName()} [${this.getActionLabel(state.action)}] wheel changed to: ${tokens.value}`))
      .catch((err) => this.error(`triggerWheelChangedFlow() > ${err}`));
  }

  getActionLabel(action) {
    const label = super.getActionLabel(action);
    // eslint-disable-next-line no-nested-ternary
    return label !== 'unknown' ? label : action === '4' ? 'Touch' : action === '5' ? 'Wheel' : action === '11' ? 'Wheel final' : 'unknown';
  }

};
