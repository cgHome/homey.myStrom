'use strict';

const Homey = require('homey');

module.exports = class Driver extends Homey.Driver {

  onInit(options = {}) {
    this.logDebug('onInit()');

    this.ready()
      .then(this.driverReady());
  }

  driverReady() {
    this.logInfo('Driver ready');
  }

  // Homey-App Loggers
  logError(msg) {
    this.error(`[ERROR] ${this._logLinePrefix()} ${msg}`);
  }

  logInfo(msg) {
    this.log(`[INFO] ${this._logLinePrefix()} ${msg}`);
  }

  logDebug(msg) {
    this.log(`[DEBUG] ${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return '';
  }

};
