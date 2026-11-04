'use strict';

const { MyHttpDevice } = require('my-homey');

const GEN_ACTION_FAST_RETRIES = 3;
const GEN_ACTION_RETRY_DELAY = 10 * 60 * 1000;

module.exports = class BaseDevice extends MyHttpDevice {

  #refreshDeviceInterval = null;
  #genActionSubscribed = false;
  #genActionFailures = 0;
  #genActionRetryAt = 0;
  #listeners = {};

  onInit() {
    super.onInit();

    this.#listeners = {
      [`deviceGenAction-${this.data.mac}`]: (params) => this.deviceGenActionReceived(params),
      [`deviceSeen-${this.data.mac}`]: () => this.onDeviceSeen(),
    };
    Object.entries(this.#listeners).forEach(([event, listener]) => this.homey.on(event, listener));
  }

  // Devices pushing actions to Homey return their myStrom action path.
  get genActionPath() {
    return null;
  }

  subscribeDeviceGenAction() {
    return this.homey.cloud.getLocalAddress()
      .then((localAddress) => {
        const value = `get://${localAddress}/api/app/${this.homey.manifest.id}/deviceGenAction`;
        return this.setDeviceData(this.genActionPath, value);
      })
      .then((data) => {
        this.#genActionSubscribed = true;
        this.#genActionFailures = 0;
        this.logDebug(`subscribeDeviceGenAction() > ${data || '[none]'}`);
      })
      .catch((err) => {
        this.#genActionFailures += 1;
        if (this.#genActionFailures >= GEN_ACTION_FAST_RETRIES) {
          this.#genActionRetryAt = Date.now() + GEN_ACTION_RETRY_DELAY;
        }
        // Battery devices sleep between presses, being unreachable is their normal state.
        if (this.hasCapability('measure_battery')) this.setAvailable();
        this.logError(`subscribeDeviceGenAction() > ${err}`);
      });
  }

  onDeviceSeen() {
    if (this.genActionPath && !this.#genActionSubscribed && Date.now() >= this.#genActionRetryAt) {
      this.subscribeDeviceGenAction();
    }
  }

  // initDevice() {
  //   return super.initDevice()
  // }

  initDeviceRefresh() {
    this.logDebug('initDeviceRefresh()');
    this.#refreshDeviceInterval = this.homey.setInterval(() => {
      this.logDebug('deviceRefresh()');
      this.getDeviceValues();
    }, 1 * 60 * 1000); // set interval to every 1 minutes.
  }

  // Homey Lifecycle

  onDeleted() {
    super.onDeleted();
    this.#release();
  }

  onUnload() {
    super.onUnload();
    this.#release();
  }

  #release() {
    if (this.#refreshDeviceInterval !== null) {
      this.homey.clearInterval(this.#refreshDeviceInterval);
    }
    Object.entries(this.#listeners).forEach(([event, listener]) => this.homey.removeListener(event, listener));
  }

  // MyHttpDevice

  getBaseURL() {
    return `http://${this.getStoreValue('address')}/api/v1/`;
  }

  // myStromDevice action

  deviceGenActionReceived(params) {
    this.logDebug(`deviceGenActionReceived() > ${JSON.stringify(params)}`);
  }

};
