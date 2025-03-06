'use strict';

const dns = require('node:dns');
const dgram = require('node:dgram');
const { Bonjour } = require('bonjour-service');

const { MyApp } = require('my-homey');

// see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
// eslint-disable-next-line no-unused-vars
const DEVICE_TYPE = {
  101: 'Switch CH v1',
  102: 'Bulb',
  103: 'Button +',
  104: 'Button',
  105: 'LED-strip',
  106: 'Switch CH v2',
  107: 'Switch EU',
  110: 'Motion Sensor',
  112: 'Gateway',
  113: 'STECCO/CUBO',
  118: 'Button Plus 2nd gen',
  120: 'Switch Zero',
};

module.exports = class MyStromApp extends MyApp {

  #devices = {};

  get devices() {
    return this.#devices;
  }

  onInit() {
    super.onInit();

    this.discoveryMyStromDevices();

    this.logInfo('App has been initialized');
  }

  // Web-API > deviceGenAction
  async deviceGenActionAPI(params) {
    this.logDebug(`deviceGenActionAPI() - ${JSON.stringify(params)}`);
    this.homey.emit(`deviceGenAction-${params.mac}`, params);
  }

  discoveryMyStromDevices() {
    const browser = (new Bonjour()).find({ type: 'hap' }, (service) => {
      if (service.host.match('myStrom-Switch')) {
        const deviceName = service.host.slice(0, service.host.indexOf('.'));
        const mac = service.txt.id.replace(new RegExp(':', 'g'), '').toUpperCase();
        const device = {
          name: deviceName,
          data: {
            id: mac,
            mac,
            deviceName,
            host: service.host,
            type: mac.match('64002D') ? 101 : 106,
          },
          store: {
            address: service.referer.address,
          },
        };
        this.#devices[mac] = device;
        this.homey.emit('deviceDiscovered', {
          name: device.data.deviceName,
          address: device.store.address,
          mac,
        });
        this.logNotice(`Device ${device.data.deviceName} discovered - Bonjour > IP: ${device.store.address} (mac: ${mac}) / type: ${device.data.type})`);
      }
    });
    browser
      .on('error', (err) => this.notifyError(`Bonjour: ${err}`))
      .start();

    const udpClient = dgram.createSocket('udp4', (msg, rinfo) => {
      dns.reverse(rinfo.address, (err, hostnames) => {
        if (!err) {
          const hostname = hostnames[0];
          const deviceName = hostname.slice(0, hostname.indexOf('.'));
          const mac = msg.hexSlice(0, 6).toUpperCase();
          const device = {
            name: deviceName,
            data: {
              id: mac,
              mac,
              deviceName,
              host: hostnames[0],
              type: msg[6],
            },
            store: {
              address: rinfo.address,
            },
          };
          if (!this.#devices[mac]) {
            this.#devices[mac] = device;
            this.homey.emit('deviceDiscovered', {
              name: device.data.deviceName,
              address: device.store.address,
              mac,
            });
            this.logNotice(`Device ${device.data.deviceName} discovered - UDP > IP: ${device.store.address} (mac: ${mac} / type: ${device.data.type})`);
          }
        } else {
          //  this.logError(`UDP discovery failed ${err.code} - ${err.message}`);
        }
      });
    });
    udpClient
      .on('error', (err) => this.notifyError(`UDP-Client: ${err}`))
      .bind(7979);
  }

};
