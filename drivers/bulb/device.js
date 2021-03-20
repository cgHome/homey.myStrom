"use strict";

const Homey = require("homey");
const querystring = require("querystring");
const Device = require("../device");

const RAMP_DEFAULT = "0";

module.exports = class BulbDevice extends Device {
  onInit(options = {}) {
    super.onInit(options);

    this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener("light_mode", this.onCapabilityLightMode.bind(this));
    this.registerCapabilityListener("light_temperature", this.onCapabilityLightTemperature.bind(this));
    this.registerCapabilityListener("light_hue", this.onCapabilityLightHue.bind(this));
    this.registerCapabilityListener("light_saturation", this.onCapabilityLightSaturation.bind(this));
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));

    this.registerPollInterval({
      id: this.getData().id,
      fn: this.syncDeviceValues.bind(this),
      sec: 1 * 60, // set interval to every minute
    });

    this.log("BulbDevice initiated");
  }

  onDeleted() {
    super.onDeleted();
    this.deregisterPollInterval(this.getData().name);
  }

  async deviceReady() {
    try {
      await super.deviceReady();
      await this.getDeviceValues();
    } catch (err) {
      // nop
    }
  }

  async onCapabilityOnOff(value, opts) {
    const current = this.getCapabilityValue("onoff");
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityOnOff() - ${current} > ${value}`);
    const action = value ? "on" : "off";

    return this.setDeviceData("device", { action, ramp: RAMP_DEFAULT })
      .then((data) => this.getDeviceValues(null, data))
      .then(() => {
        const current = this.getCapabilityValue("onoff");
        this.notify(Homey.__("device.stateSet", { value: current ? "on" : "off" }));
      })
      .catch((err) => this.error(`onCapabilityOnOff() > ${err}`));
  }

  async onCapabilityLightMode(value, opts) {
    const current = this.getCapabilityValue("light_mode");
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityLightMode() - ${current} > ${value}`);
    const action = this.getCapabilityValue("onoff") ? "on" : "off";
    const mode = value === "temperature" ? "mono" : "hsv";

    return this.setDeviceData("device", { action, mode })
      .then((data) => this.getDeviceValues())
      .then(() => {
        const current = this.getCapabilityValue("light_mode");
        this.notify(Homey.__("device.lightModeSet", { value: current }));
      })
      .catch((err) => this.error(`onCapabilityLightMode() > ${err}`));
  }

  async onCapabilityLightTemperature(value, opts) {
    const current = this.getCapabilityValue("light_temperature");
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityLightTemperature() - ${current} > ${value}`);
    const lightTemperature = 14 - Math.round(value * 13);
    const dim = Math.round(this.getCapabilityValue("dim") * 100);
    const color = `${lightTemperature};${dim}`;

    return this.setDeviceData("device", { action: "on", mode: "mono", ramp: RAMP_DEFAULT, color })
      .then((data) => this.getDeviceValues())
      .then(() => {
        const current = this.getCapabilityValue("light_temperature");
        this.notify(Homey.__("device.lightTemperatureSet", { value: current }));
      })
      .catch((err) => this.error(`onCapabilityLightTemperature() > ${err}`));
  }

  /* eslint-disable */
  // Attention: It can only be sent in combination with the "light_saturation"
  // =========================================================================
  async onCapabilityLightHue(value, opts) {
    const current = this.getCapabilityValue("light_hue");
    if (current === value) return Promise.resolve(true);
    
    this.debug(`onCapabilityLightHue() - ${current} > ${value}`);
    const lightHue = Math.round(value * 360);
    const lightSaturation = Math.round(this.getCapabilityValue("light_saturation") * 100);
    const dim = Math.round(this.getCapabilityValue("dim") * 100);
    const color = `${lightHue};${lightSaturation};${dim}`;

    // return this.setDeviceData("device", { action: "on", mode: "hsv", ramp: RAMP_DEFAULT, color })
    //   .then((data) => this.getDeviceValues())
    //   .then(() => {
    //     const current = this.getCapabilityValue("light_hue");
    //     this.notify(Homey.__("device.lightHueSet", { value: Math.round(current * 360) }));
    //   })
    //   .catch((err) => this.error(`onCapabilityLightHue() > ${err}`));
  }
  /* eslint-enable */

  async onCapabilityLightSaturation(value, opts) {
    const current = this.getCapabilityValue("light_saturation");
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityLightSaturation() - ${current} > ${value}`);
    const lightHue = Math.round(this.getCapabilityValue("light_hue") * 360);
    const lightSaturation = Math.round(value * 100);
    const dim = Math.round(this.getCapabilityValue("dim") * 100);
    const color = `${lightHue};${lightSaturation};${dim}`;

    return this.setDeviceData("device", { action: "on", mode: "hsv", ramp: RAMP_DEFAULT, color })
      .then((data) => this.getDeviceValues())
      .then(() => {
        const hue = this.getCapabilityValue("light_hue");
        this.notify(Homey.__("device.lightHueSet", { value: Math.round(hue * 360) }));
        const saturation = this.getCapabilityValue("light_saturation");
        this.notify(Homey.__("device.lightSaturationSet", { value: Math.round(saturation * 100) }));
      })
      .catch((err) => this.error(`onCapabilityLightSaturation() > ${err}`));
  }

  async onCapabilityDim(value, opts) {
    const current = this.getCapabilityValue("dim");
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityDim() - ${current} > ${value}`);
    const action = value >= 0.01 ? "on" : "off";
    const mode = this.getCapabilityValue("light_mode") === "temperature" ? "mono" : "hsv";
    const dim = Math.round(value * 100);

    let color;
    if (mode === "mono") {
      const lightTemperature = Math.round(this.getCapabilityValue("light_temperature") * 100);
      color = `${lightTemperature};${dim}`;
    } else {
      const lightHue = Math.round(this.getCapabilityValue("light_hue") * 360);
      const lightSaturation = Math.round(this.getCapabilityValue("light_saturation") * 100);
      color = `${lightHue};${lightSaturation};${dim}`;
    }

    return this.setDeviceData("device", { action, ramp: RAMP_DEFAULT, mode, color })
      .then((data) => this.getDeviceValues())
      .then(() => {
        const current = this.getCapabilityValue("dim");
        this.notify(Homey.__("device.dimSet", { value: Math.round(current * 100) }));
      })
      .catch((err) => this.error(`onCapabilityDim() > ${err}`));
  }

  getDeviceValues(url = "device", data) {
    // eslint-disable-next-line no-shadow
    return super.getDeviceValues(url, data).then(async (data) => {
      const result = data[Object.keys(data)[0]];
      try {
        const state = result.on;
        const measurePower = Math.round(result.power * 10) / 10;
        await this.setCapabilityValue("onoff", state);
        await this.setCapabilityValue("measure_power", measurePower);
        if (result.mode === "mono") {
          const lightTemperature = Math.round((1 / 13) * (14 - parseInt(result.color.split(";")[0], 10)) * 100) / 100;
          const dim = parseInt(result.color.split(";")[1], 10) / 100;
          await this.setCapabilityValue("light_mode", "temperature");
          await this.setCapabilityValue("light_temperature", lightTemperature);
          await this.setCapabilityValue("dim", dim);
        } else {
          const lightHue = Math.round((1 / 360) * parseInt(result.color.split(";")[0], 10) * 100) / 100;
          const lightSaturation = parseInt(result.color.split(";")[1], 10) / 100;
          const dim = parseInt(result.color.split(";")[2], 10) / 100;
          await this.setCapabilityValue("light_mode", "color");
          await this.setCapabilityValue("light_hue", lightHue);
          await this.setCapabilityValue("light_saturation", lightSaturation);
          await this.setCapabilityValue("dim", dim);
        }
      } catch (err) {
        this.error(`getDeviceValues() > ${err}`);
      }
      return data;
    });
  }

  setDeviceData(url, data) {
    url = `${url}/${this.getData().id}`;
    const qString = querystring.stringify(data).split("%3B").join(";");
    return super.setDeviceData(url, qString);
  }
};
