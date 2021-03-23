"use strict";

const Homey = require("homey");
const querystring = require("querystring");
const Device = require("../device");

const RAMP_DEFAULT = "0";

module.exports = class BulbDevice extends Device {
  onInit(options = {}) {
    super.onInit(options);

    this.bulpMode = null; // Current mode

    // Remove unused/old capability
    if (this.hasCapability("light_mode")) {
      this.removeCapability("light_mode");
    }

    this.registerCapabilityListener("onoff", this.onCapabilityOnOff.bind(this));
    this.registerCapabilityListener("dim", this.onCapabilityDim.bind(this));
    this.registerCapabilityListener("light_temperature", this.onCapabilityLightTemperature.bind(this));
    this.registerMultipleCapabilityListener(
      ["light_hue", "light_saturation"],
      this.onCapabilityLightHueSaturation.bind(this)
    );

    this.registerPollInterval({
      id: this.getData().id,
      fn: this.syncDeviceValues.bind(this),
      sec: 1 * 60, // set interval to every minute
    });

    this.log("BulbDevice initiated");
  }

  onDeleted() {
    super.onDeleted();
    this.deregisterPollInterval(this.getData().id);
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

  async onCapabilityDim(value, opts) {
    const current = this.getCapabilityValue("dim");
    if (current === value) return Promise.resolve(true);

    this.debug(`onCapabilityDim() - ${current} > ${value}`);
    const action = value >= 0.01 ? "on" : "off";
    const dim = Math.round(value * 100);

    let color;
    if (this.bulpMode === "mono") {
      const lightTemperature = 14 - Math.round(this.getCapabilityValue("light_temperature") * 13);
      color = `${lightTemperature};${dim}`;
    } else {
      const lightHue = Math.round(this.getCapabilityValue("light_hue") * 360);
      const lightSaturation = Math.round(this.getCapabilityValue("light_saturation") * 100);
      color = `${lightHue};${lightSaturation};${dim}`;
    }

    return this.setDeviceData("device", { action, ramp: RAMP_DEFAULT, mode: this.bulpMode, color })
      .then((data) => this.getDeviceValues())
      .then(() => {
        const current = this.getCapabilityValue("dim");
        this.notify(Homey.__("device.dimSet", { value: Math.round(current * 100) }));
      })
      .catch((err) => this.error(`onCapabilityDim() > ${err}`));
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

  async onCapabilityLightHueSaturation(values, options) {
    const curHue = this.getCapabilityValue("light_hue");
    const valHue = values.light_hue || curHue;
    const curSaturation = this.getCapabilityValue("light_saturation");
    const valSaturation = values.saturation || curSaturation;

    if (!(curHue !== valHue || curSaturation !== valSaturation)) return Promise.resolve(true);

    this.debug(`onCapabilityLightHueSaturation() light_hue - ${curHue} > ${valHue}`);
    this.debug(`onCapabilityLightHueSaturation() light_saturation - ${curSaturation} > ${valSaturation}`);

    const hue = Math.round(valHue * 360);
    const saturation = Math.round(valSaturation * 100);
    const dim = Math.round(this.getCapabilityValue("dim") * 100);
    const color = `${hue};${saturation};${dim}`;

    return this.setDeviceData("device", { action: "on", mode: "hsv", ramp: RAMP_DEFAULT, color })
      .then((data) => this.getDeviceValues())
      .then(() => {
        this.notify(
          Homey.__("device.lightHueSet", {
            value: Math.round(this.getCapabilityValue("light_hue") * 360),
          })
        );
        this.notify(
          Homey.__("device.lightSaturationSet", {
            value: Math.round(this.getCapabilityValue("light_saturation") * 100),
          })
        );
      })
      .catch((err) => this.error(`onCapabilityLightHue() > ${err}`));
  }

  getDeviceValues(url = "device", data) {
    // eslint-disable-next-line no-shadow
    return super.getDeviceValues(url, data).then(async (data) => {
      const result = data[Object.keys(data)[0]];
      try {
        const state = result.on;
        await this.setCapabilityValue("onoff", state);
        const measurePower = Math.round(result.power * 10) / 10;
        await this.setCapabilityValue("measure_power", measurePower);
        this.bulpMode = result.mode;
        if (this.bulpMode === "mono") {
          const lightTemperature = Math.round((1 / 13) * (14 - parseInt(result.color.split(";")[0], 10)) * 100) / 100;
          await this.setCapabilityValue("light_temperature", lightTemperature);
          const dim = parseInt(result.color.split(";")[1], 10) / 100;
          await this.setCapabilityValue("dim", dim);
        } else {
          const lightHue = Math.round((1 / 360) * parseInt(result.color.split(";")[0], 10) * 100) / 100;
          await this.setCapabilityValue("light_hue", lightHue);
          const lightSaturation = parseInt(result.color.split(";")[1], 10) / 100;
          await this.setCapabilityValue("light_saturation", lightSaturation);
          const dim = parseInt(result.color.split(";")[2], 10) / 100;
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
