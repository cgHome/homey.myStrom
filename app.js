'use strict';

const dns = require('dns');
const dgram = require('dgram');
const bonjour = require('bonjour')();

const Homey = require('homey');

if (process.env.DEBUG === '1') {
  try {
    // eslint-disable-next-line global-require
    require('node:inspector').waitForDebugger();
  } catch (err) {
    // eslint-disable-next-line global-require
    require('node:inspector').open(9229, '0.0.0.0', true);
  }
}

module.exports = class MyStromApp extends Homey.App {

  constructor(...args) {
    super(...args);

    this.devices = {};

    // see device-types on: https://api.mystrom.ch/#51094bbb-3807-47d2-b60e-dabf757d1f8e
    this.deviceType = Object.freeze({
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
    });
  }

  onInit(options = {}) {
    this.logDebug('onInit()');

    // Find myStrom-Devices
    const browser = bonjour.find({ type: 'hap' }, (service) => {
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
        this.devices[mac] = device;
        this.homey.emit('deviceDiscovered', {
          name: device.data.deviceName,
          address: device.store.address,
          mac,
        });
        this.notify(`Device ${device.data.deviceName} discovered - Bonjour > IP: ${device.store.address} (mac: ${mac}) / type: ${device.data.type})`);
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
          if (!this.devices[mac]) {
            this.devices[mac] = device;
            this.homey.emit('deviceDiscovered', {
              name: device.data.deviceName,
              address: device.store.address,
              mac,
            });
            this.notify(`Device ${device.data.deviceName} discovered - UDP > IP: ${device.store.address} (mac: ${mac} / type: ${device.data.type})`);
          }
        } else {
          //  this.logError(`UDP discovery failed ${err.code} - ${err.message}`);
        }
      });
    });
    udpClient
      .on('error', (err) => this.notifyError(`UDP-Client: ${err}`))
      .bind(7979);

    this.logInfo(`${this.homey.manifest.name.en} - v${this.homey.manifest.version} is started`);
  }

  // Web-API > deviceGenAction
  async deviceGenActionAPI(params) {
    this.logDebug(`deviceGenActionAPI() - ${JSON.stringify(params)}`);
    this.homey.emit(`deviceGenAction-${params.mac}`, params);
  }

  notify(msg) {
    this.homey.setTimeout(() => {
      msg = (typeof msg !== 'function') ? msg : msg();
      this.homey.notifications.createNotification({ excerpt: `**MyStromApp** - ${msg}` })
        .catch((err) => this.logError(`createNotification() > ${err}`));
      this.logInfo(`[NOTIFY] ${msg}`);
    }, 1000);
  }

  async notifyError(msg) {
    await this.homey.notifications.createNotification({ excerpt: `**${this.homey.manifest.name.en}** - Error: ${msg}` })
      .catch((err) => this.logError(`createNotification() > ${err}`));
    this.logError(`${msg}`);
  }

  logError(msg) {
    this.error(`${msg}`);
  }

  logInfo(msg) {
    this.log(`[INFO] ${msg}`);
  }

  logDebug(msg) {
    if (process.env.DEBUG === '1') {
      this.log(`[DEBUG] ${msg}`);
    }
  }

};
