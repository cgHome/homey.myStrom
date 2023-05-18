'use strict';

const BaseDriver = require('../driver');

module.exports = class PirDriver extends BaseDriver {

  onInit() {
    super.onInit();

    // Create flow-cards
    this.__flowTriggerLightStateChanged = this.homey.flow.getDeviceTriggerCard('lightState_changed');
    this.__flowTriggerLightStateChanged
      .registerRunListener((args, state) => args.lightState === state.lightState);

    this._lightStateCondition = this.homey.flow.getConditionCard('is_lightState');
    this._lightStateCondition
      .registerRunListener((args, state) => args.device.getCapabilityValue('light_state') === args.lightState);
  }

  async onPairListDevices() {
    // see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
    return (Object.values(this.homey.app.devices) || [])
      .filter((device) => device.data.type === 110);
  }

  triggerLightStateChangedFlow(device, tokens, state) {
    this.__flowTriggerLightStateChanged
      .trigger(device, tokens, state)
      .then(device.log(`light state changed to ${state.lightState}`))
      .catch((err) => this.logError(`triggerLightStateChangedFlow() > ${err}`));
  }

};
