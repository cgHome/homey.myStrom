'use strict';

const Homey = require('homey');

module.exports = class Driver extends Homey.Driver {

  onInit(options = {}) {
    this.debug('onInit()');

    this.ready()
      .then(this.driverReady());
  }

  driverReady() {
    this.log('Driver ready');
  }

  // Homey-App Loggers
  error(msg) {
    super.error(`[ERROR] ${this._logLinePrefix()} ${msg}`);
  }

  log(msg) {
    super.log(`[INFO] ${this._logLinePrefix()} ${msg}`);
  }

  debug(msg) {
    super.log(`[DEBUG] ${this._logLinePrefix()} ${msg}`);
  }

  _logLinePrefix() {
    return `${this.constructor.name} >`;
  }

};
