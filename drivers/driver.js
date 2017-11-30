'use strict';

const Homey = require('homey');
const WebAPIDriver = require('homey-wifidriver').WebAPIDriver;

module.exports = class MyStromDriver extends WebAPIDriver {
    onInit(options = {}) {
        super.onInit(options);
        
        this.log('Driver onInit ....');
    }
}