'use strict';

const { MyHttpDevice } = require('my-homey');

module.exports = class BaseDevice extends MyHttpDevice {

  #refreshDeviceInterval = null;

  onInit() {
    super.onInit();

    this.homey.on(`deviceGenAction-${this.data.mac}`, async (params) => {
      this.deviceGenActionReceived(params);
    });
  }

  initDevice() {
    return super.initDevice()
      .then(this.initDeviceRefresh())
      .catch((err) => this.logError(`initDevice() > ${err}`));
  }

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
    this.homey.clearInterval(this.#refreshDeviceInterval);
  }

  onUnload() {
    super.onUnload();
    this.homey.clearInterval(this.#refreshDeviceInterval);
  }

  // MyHttpDevice

  getBaseURL() {
    return `http://${this.getStoreValue('address')}/api/v1/`;
  }

  // myStromDevice action

  deviceGenActionReceived(params) {
    this.logDebug(`deviceGenActionReceived() > ${JSON.stringify(params)}`);
  }

  // NOTE: simplelog-api on/off

  // logError(msg) {
  //   if (process.env.DEBUG === '1') {
  //     this.error(`[ERROR] ${this.getName()} > ${msg}}`);
  //   } else {
  //     this.error(msg);
  //   }
  // }

  // logNotice(msg) {
  //   this.log(`[NOTICE] ${this.getName()} > ${msg}`);
  // }

  // logInfo(msg) {
  //   this.log(`[INFO] ${this.getName()} > ${msg}`);
  // }

  // logDebug(msg) {
  //   this.log(`[DEBUG] ${this.getName()} > ${msg}`);
  // }

};
