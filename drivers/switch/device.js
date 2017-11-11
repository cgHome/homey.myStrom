'use strict';

const Homey = require('homey');
const WebAPIDevice = require('homey-wifidriver').WebAPIDevice;

module.exports = class MyStromSwitch extends WebAPIDevice {
    async onInit(options) {
        await super.onInit()
            .catch(err => {
                this.error('error onInit', err.stack);
                return err;
            });

        this.log(`device ${this.getName()} (${this.getClass()}) init`);

        this.setDefaultBaseUrl(`http://${this.getData().address}/`);
        this.setUnavailable(Homey.__('connecting'));

        this.registerPollInterval();
        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
        this.registerCapabilityListener('measure_power', this.onCapabilityMeasurePower.bind(this));
    };

    registerPollInterval() {
        super.registerPollInterval({
            id: this.getData().deviceName,
            fn: this.getValues.bind(this),
            interval: 5000, // 5 sec
        });
    };

    getValues() {
        return this.apiCallGet({ uri: 'report' })
            .then(result => {
                let state = result.relay;
                if (typeof this.state === 'undefined' || this.state !== state) {
                    this.state = state;
                    this.setCapabilityValue('onoff', this.state);
                };
                let measurePower = Math.round(result.power * 10) / 10;
                if (typeof this.measurePower === 'undefined' || this.measurePower !== measurePower) {
                    this.measurePower = measurePower;
                    this.setCapabilityValue('measure_power', this.measurePower);
                };
                // this.log(`device ${this.getName()} refreshed`);
                this.setAvailable();
            })
            .catch(err => {
                this.error('Failed to get data', err.stack);
                this.setUnavailable(err);
                throw err;
            });
    };

    onAdded() {
        this.log('device added');
        super.onAdded();
    };

    onDeleted() {
        this.log('device deleted');
        super.onDeleted();
    };

    onCapabilityOnoff(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityOnoff value: ${value}`);

        return this.apiCallGet({ uri: `relay?state=${value ? '1' : '0'}` })
            .then(result => {
                this.getValues();
            })
            .catch(err => {
                this.error('failed to set capability', err.stack);
                this.setUnavailable(err);
                throw err;
            });
    };

    onCapabilityMeasurePower(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityMeasurePower value: ${value}`);
    };
}