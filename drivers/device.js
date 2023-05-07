'use strict';

const Homey = require('homey');
const HttpAPI = require('../lib/httpAPI');

module.exports = class Device extends Homey.Device {

  get data() {
    return this.getData();
  }

  async onInit(options) {
    super.onInit(options);
    this.logDebug('onInit()');

    // Compatibility fix < v1.1.1
    if (typeof this.data.address !== 'undefined') {
      await this.setStoreValue('address', this.data.address);
    }

    this.httpAPI = new HttpAPI(this, options.baseURL || `http://${this.getStoreValue('address')}/api/v1/`, this._logLinePrefix());

    this.setUnavailable(this.homey.__('device.connecting'));

    this.homey.on(`deviceGenAction-${this.data.mac}`, async (params) => {
      this.deviceGenActionReceived(params);
    });

    this.ready()
      .then(this.initDevice())
      .then(this.setAvailable())
      .then(this.logInfo('Device ready'));
  }

  initDevice() {
    return Promise.resolve(true);
  }

  initDeviceRefresh() {
    this.logDebug('initDeviceRefresh()');
    this._refreshInterval = this.homey.setInterval(() => {
      this.logDebug('deviceRefresh()');
      this.getDeviceValues();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.

    this.homey.on('unload', () => {
      this.logDebug('initDeviceRefresh() > homeyEvent: unload');
      this.homey.clearInterval(this._refreshInterval);
    });
  }

  async onAdded() {
    this.logInfo(`Device ${this.getName()} added`);
  }

  async onDeleted() {
    this.logInfo(`Device ${this.getName()} deleted`);
    if (typeof this._refreshInterval !== 'undefined') {
      this.homey.clearInterval(this._refreshInterval);
    }
  }

  deviceGenActionReceived(params) {
    this.logDebug(`deviceGenActionReceived() > ${JSON.stringify(params)}`);
  }

  setCapabilityValue(capabilityId, value) {
    const currentValue = this.getCapabilityValue(capabilityId);

    if (typeof value === 'undefined' || Number.isNaN(value)) {
      this.logError(`setCapabilityValue() '${capabilityId}' - value > ${value}`);
      return Promise.resolve(currentValue);
    }
    if (value === currentValue) {
      return Promise.resolve(currentValue);
    }

    return super.setCapabilityValue(capabilityId, value)
      .then(() => {
        this.logDebug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
        return value;
      })
      .catch((err) => {
        return this.logError(`setCapabilityValue() '${capabilityId}' > ${err}`);
      });
  }

  // Data handling
  getDeviceValues(url = '**unknown**') {
    this.logDebug(`getDeviceValues() - '${url}'`);
    return this.getDeviceData(url);
  }

  getDeviceData(url) {
    return this.httpAPI.get(url)
      .then((json) => {
        this.logDebug(`getDeviceData() - '${url}' > ${JSON.stringify(json)}`);
        this.setAvailable()
          .catch((err) => this.logError(`setAvailable() > ${err}`));
        return json;
      })
      .catch((err) => {
        this.logError(`getDeviceData() - '${url}' > ${err}`);
        this._handelHttpError(err);
        throw new Error(`Get device-data failed (${(err.response && err.response.status) || err.code})`);
      });
  }

  setDeviceData(url, value) {
    return this.httpAPI.post(url, value)
      .then((json) => {
        this.logDebug(`setDeviceData() - '${url}' > ${JSON.stringify(value) || ''}`);
        this.setAvailable()
          .catch((err) => this.logError(`setAvailable() > ${err}`));
        return json;
      })
      .catch((err) => {
        this.logError(`setDeviceData() - '${url}' ${JSON.stringify(value)} > ${err}`);
        this._handelHttpError(err);
        throw new Error(`Set device-data failed (${(err.response && err.response.status) || err.code})`);
      });
  }

  _handelHttpError(err) {
    if (err.response) {
      if (err.response.status === 404) {
        this.setUnavailable(this.homey.__('device.error', { msg: `Path not found '${err.request.path}'` }));
      } else {
        this.setUnavailable(this.homey.__('device.error', { msg: err }));
      }
    } else if (err.request) {
      if (err.code === 'EHOSTUNREACH' || err.code === 'ENETUNREACH') {
        this.setUnavailable(this.homey.__('device.offline'));
      } else {
        this.setUnavailable(this.homey.__('device.error', { msg: err.code }));
      }
    }
  }

  notify(msg) {
    this.homey.setTimeout(() => {
      msg = (typeof msg !== 'function') ? msg : msg();
      // this.homey.notifications.createNotification({ excerpt: `**MyStromApp** - ${msg}` })
      //   .catch((err) =>  this.logError(`createNotification() > ${err}`));
      this.log(`[NOTIFY] ${this._logLinePrefix()} > ${msg}`);
    }, 1000);
  }

  // Homey-App Loggers
  logError(msg) {
    this.error(`[ERROR] ${this._logLinePrefix()} > ${msg}`);
  }

  logInfo(msg) {
    this.log(`[INFO] ${this._logLinePrefix()} > ${msg}`);
  }

  logDebug(msg) {
    this.log(`[DEBUG] ${this._logLinePrefix()} > ${msg}`);
  }

  _logLinePrefix() {
    return `${this.getName()}`;
  }

};
