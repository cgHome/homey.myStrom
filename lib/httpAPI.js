'use strict';

const Axios = require('axios');

module.exports = class HttpAPI {

  constructor(owner, baseURL = 'NoURL', name = '###') {
    this.owner = owner;
    this.homey = owner.homey;
    this.baseURL = baseURL;
    this.name = name;

    this.axios = Axios.create({ baseURL });

    this._initInterceptors();

    this.logDebug('Initialized');
  }

  setAddress(value) {
    this.address = value;
  }

  getName() {
    return this.name;
  }

  get(url, config = {}) {
    return this.axios.get(url, config)
      .then((response) => response.data);
  }

  post(url, data, config = {}) {
    if (data !== null) {
      switch (typeof data) {
        case 'string':
          config.headers = { 'Content-Type': 'text/plain' };
          break;
        case 'object':
          config.headers = { 'Content-Type': 'application/json' };
          break;
        default:
      }
    }
    return this.axios.post(url, data, config)
      .then((response) => response.data);
  }

  put(url, data, config = {}) {
    return this.axios.put(url, data, config)
      .then((response) => response.data);
  }

  delete(url, config = {}) {
    return this.axios.delete(url, config)
      .then((response) => response.data);
  }

  _initInterceptors() {
    // this.logDebug("_initInterceptors()");
    this.axios.interceptors.request.use(
      (config) => {
        if (config._callOnce) return config;
        config._callOnce = true;

        const msgPrefix = `${config.method.toUpperCase()} -> '${config.url}'`;
        this.logDebug(`${msgPrefix} ${config.data ? `- ${JSON.stringify(config.data)}` : ''}`);
        return config;
      },
      (error) => {
        if (error._callOnce) return Promise.reject(error);
        error._callOnce = true;

        const msgPrefix = `${error.request.method.toUpperCase()} '${error.request.url}' > `;
        this.logError(`${msgPrefix} ${error.message}`);

        // Show the error only in the debug mode.
        if (process.env.DEBUG === '1') {
          this.logError(`${msgPrefix} > ${error.request}`);
        }
        return Promise.reject(error);
      },
    );

    this.axios.interceptors.response.use(
      (response) => {
        if (response._callOnce) return response;
        response._callOnce = true;

        const msgPrefix = `${response.config.method.toUpperCase()} <- '${response.config.url}'`;
        this.logDebug(`${msgPrefix} ${response.data ? `- ${JSON.stringify(response.data)}` : ''}`);

        return response;
      },
      (error) => {
        if (error._callOnce) return Promise.reject(error);
        error._callOnce = true;

        const statusCode = error.response ? error.response.status : null;
        const msgPrefix = `${error.config.method.toUpperCase()} '${error.config.url}' > `;
        this.logError(`${msgPrefix} ${error.message}`);

        // Show the error only in the debug mode.
        if (process.env.DEBUG === '1') {
          this.logError(`${msgPrefix} url: ${error.config.baseURL.concat(error.config.url)}`);
          this.logError(`${msgPrefix} status: ${statusCode}`);
          this.logError(`${msgPrefix} data: ${error.response ? error.response.data : '-'}`);
          this.logError(`${msgPrefix} headers: ${error.response ? JSON.stringify(error.response.headers) : '-'}`);
        }

        switch (statusCode) {
          case 401:
            // utils.redirectTo("/login")
            break;
          case 404:
            // return Promise.reject(Error(`${error.config.url} not found`));
            break;
          default:
            break;
        }

        return Promise.reject(error);
      },
    );
  }

  // Homey-App Loggers
  logError(msg) {
    this.owner.logError(`${this._logLinePrefix()}-${msg}`);
  }

  logInfo(msg) {
    this.owner.logInfo(`${this._logLinePrefix()}-${msg}`);
  }

  logDebug(msg) {
    // Only for http-api tests
    this.owner.logDebug(`${this._logLinePrefix()}-${msg}`);
  }

  _logLinePrefix() {
    return `${this.constructor.name}`;
  }

};
