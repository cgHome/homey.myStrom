'use strict';

const Homey = require('homey');
const HttpAPI = require('../lib/httpAPI');

module.exports = class Device extends Homey.Device {

  get data() {
    return this.getData();
  }

  async onInit(options) {
    super.onInit(options);
    this.debug('onInit()');

    // Compatibility fix < v1.1.1
    if (typeof this.data.address !== 'undefined') {
      await this.setStoreValue('address', this.data.address);
    }

    this.httpAPI = new HttpAPI(this.homey, options.baseURL || `http://${this.getStoreValue('address')}/api/v1/`, this._logLinePrefix());

    this.setUnavailable(this.homey.__('device.connecting'));

    this.homey.on(`deviceGenAction-${this.data.mac}`, async (params) => {
      this.deviceGenActionReceived(params);
    });

    this.ready()
      .then(this.initDevice())
      .then(this.setAvailable())
      .then(this.log('Device ready'));
  }

  initDevice() {
    return Promise.resolve(true);
  }

  initDeviceRefresh() {
    this.debug('initDeviceRefresh()');
    this._refreshInterval = this.homey.setInterval(() => {
      this.debug('deviceRefresh()');
      this.getDeviceValues();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.

    this.homey.on('unload', () => {
      this.debug('initDeviceRefresh() > homeyEvent: unload');
      this.homey.clearInterval(this._refreshInterval);
    });
  }

  async onAdded() {
    this.log(`Device ${this.getName()} added`);
  }

  async onDeleted() {
    this.log(`Device ${this.getName()} deleted`);
    if (typeof this._refreshInterval !== 'undefined') {
      this.homey.clearInterval(this._refreshInterval);
    }
  }

  deviceGenActionReceived(params) {
    this.debug(`deviceGenActionReceived() > ${JSON.stringify(params)}`);
  }

  setCapabilityValue(capabilityId, value) {
    const currentValue = this.getCapabilityValue(capabilityId);

    if (typeof value === 'undefined' || Number.isNaN(value)) {
      this.error(`setCapabilityValue() '${capabilityId}' - value > ${value}`);
      return Promise.resolve(currentValue);
    }
    if (value === currentValue) {
      return Promise.resolve(currentValue);
    }

    return super.setCapabilityValue(capabilityId, value)
      .then(() => {
        this.debug(`setCapabilityValue() '${capabilityId}' - ${currentValue} > ${value}`);
        return value;
      })
      .catch((err) => {
        return this.error(`setCapabilityValue() '${capabilityId}' > ${err}`);
      });
  }

  // Data handling
  getDeviceValues(url = '**unknown**') {
    this.debug(`getDeviceValues() - '${url}'`);
    return this.getDeviceData(url);
  }

  getDeviceData(url) {
    return this.httpAPI.get(url)
      .then((json) => {
        this.debug(`getDeviceData() - '${url}' > ${JSON.stringify(json)}`);
        this.setAvailable()
          .catch((err) => this.error(`setAvailable() > ${err}`));
        return json;
      })
      .catch((err) => {
        this.error(`getDeviceData() - '${url}' > ${err}`);
        this._handelHttpError(err);
        throw new Error(`Get device-data failed (${(err.response && err.response.status) || err.code})`);
      });
  }

  setDeviceData(url, value) {
    return this.httpAPI.post(url, value)
      .then((json) => {
        this.debug(`setDeviceData() - '${url}' > ${JSON.stringify(value) || ''}`);
        this.setAvailable()
          .catch((err) => this.error(`setAvailable() > ${err}`));
        return json;
      })
      .catch((err) => {
        this.error(`setDeviceData() - '${url}' ${JSON.stringify(value)} > ${err}`);
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
      // this.homey.notifications.createNotification({ excerpt: `**${this.getName()}** ${msg}` })
      this.homey.app.log(`[NOTIFY] ${this._logLinePrefix()} > ${msg}`);
    }, 1000);
  }

  log(msg) {
    this.homey.app.log(`${this._logLinePrefix()} > ${msg}`);
  }

  error(msg) {
    this.homey.app.error(`${this._logLinePrefix()} > ${msg}`);
  }

  debug(msg) {
    this.homey.app.debug(`${this._logLinePrefix()} > ${msg}`);
  }

  _logLinePrefix() {
    return `${this.constructor.name}::${this.getName()}`;
  }

};
