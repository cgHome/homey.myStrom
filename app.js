'use strict';

const Homey = require('homey');
const dns = require('dns');
const dgram = require('dgram');
const bonjour = require('bonjour')();

/* eslint-disable */
if (process.env.DEBUG === "1") {
  require("inspector").open(9229, "0.0.0.0", false);
  // require("inspector").open(9229, "0.0.0.0", true);
}
/* eslint-enable */

module.exports = class MyStromApp extends Homey.App {

  constructor(...args) {
    super(...args);

    this.devices = {};
    this.deviceType = Object.freeze({
      WSW: 101, // WiFi Switch CH v1
      WRB: 102, // WiFi Bulb
      WBP: 103, // WiFi Button +
      WBS: 104, // WiFi Button
      WLS: 105, // WiFi LED-strip
      WS2: 106, // WiFi Switch CH v2
      WSE: 107, // WiFi Switch EU
    });
  }

  onInit() {
    this.log(`${this.homey.manifest.name.en} app - v${this.homey.manifest.version} is running...`);

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
            address: service.referer.address,
            type: mac.match('64002D') ? this.deviceType.WSW : this.deviceType.WS2,
          },
        };
        this.devices[mac] = device;
        this.homey.emit('deviceDiscovered', {
          name: device.data.deviceName,
          address: device.data.address,
          mac,
        });
        this.log(
          `Bonjour discovered device ${device.data.deviceName} found ${device.data.address} (${mac}) - (Type: ${device.data.type})`,
        );
      }
    });
    browser.start();

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
              host: hostname,
              address: rinfo.address,
              type: msg[6],
            },
          };
          if (!this.devices[mac]) {
            this.devices[mac] = device;
            this.homey.emit('deviceDiscovered', {
              name: device.data.deviceName,
              address: device.data.address,
              mac,
            });
            this.log(
              `UDP discovered device ${device.data.deviceName} found ${device.data.address} (${mac}) - (Type: ${device.data.type})`,
            );
          }
        } else {
          // this.error(`UDP discovery failed ${err.code} - ${err.message}`);
        }
      });
    });
    udpClient.bind(7979);
  }

  // Web-API
  async deviceGenActionAPI(query) {
    this.debug(`deviceGenActionAPI() - ${JSON.stringify(query)}`);
    this.homey.emit('deviceActionReceived', query);
  }

  // Homey-App Loggers
  log(msg) {
    super.log(msg);
  }

  error(msg) {
    super.error(`${msg}`);
  }

  debug(msg) {
    if (process.env.DEBUG === '1') {
      super.log(`»»» ${msg}`);
    }
  }

};
