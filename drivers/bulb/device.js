'use strict';

const Homey = require('homey');
const MyStromDevice = require('../device');

module.exports = class MyStromBulb extends MyStromDevice {
    onInit(options = {}) {
        super.onInit(options)

        this.registerCapabilityListener('onoff', this.onCapabilityOnoff.bind(this));
        this.registerCapabilityListener('light_hue', this.onCapabilityLightHue.bind(this));
        this.registerCapabilityListener('light_saturation', this.onCapabilityLightSaturation.bind(this));
        this.registerCapabilityListener('dim', this.onCapabilityDim.bind(this));
        this.registerCapabilityListener('measure_power', this.onCapabilityMeasurePower.bind(this));

        this.registerPollInterval();
    };

    onCapabilityOnoff(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityOnoff value: ${value}`);

        return this.apiCallPost(`action=${value ? 'on' : 'off'}`)
            .then(result => {
                this.getValues();
            })
            .catch(err => {
                this.error('failed to set OnOff', err.stack);
                this.setUnavailable(err);
                throw err;
            });
    };

    onCapabilityLightMode(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityLightMode value: ${value}`);

        return this.apiCallPost(`mode=${value === 'color' ? 'hsv' : 'mono'}`)
            .then(result => {
                this.getValues();
            })
            .catch(err => {
                this.error('failed to set light mode', err.stack);
                this.setUnavailable(err);
                throw err;
            });
    };

    onCapabilityDim(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityDim value: ${value}`);

        if (value < 0.01) {
            this.onCapabilityOnoff(false);
        }
        else {
            this.onCapabilityOnoff(true);
        };

        return this.apiCallPost(`color=${Math.round(this.lightHue * 360)};${this.lightSaturation * 100};${value * 100}`)
            .then(result => {
                this.getValues();
            })
            .catch(err => {
                this.error('failed to set dim', err.stack);
                this.setUnavailable(err);
                throw err;
            });
    };

    onCapabilityLightHue(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityLightHue value: ${value}`);

        return this.apiCallPost(`color=${Math.round(value * 360)};${this.lightSaturation * 100};${this.dim * 100}`)
            .then(result => {
                this.getValues();
            })
            .catch(err => {
                this.error('failed to set light hue', err.stack);
                this.setUnavailable(err);
                throw err;
            });

    };

    onCapabilityLightSaturation(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityLightSaturation value: ${value}`);

        return this.apiCallPost(`color=${Math.round(this.lightHue * 360)};${value * 100};${this.dim * 100}`)
            .then(result => {
                this.getValues();
            })
            .catch(err => {
                this.error('failed to set light saturation', err.stack);
                this.setUnavailable(err);
                throw err;
            });

    };

    onCapabilityMeasurePower(value, opts, callback) {
        this.log(`[${this.getName()}] onCapabilityMeasurePower value: ${value}`);
    };

    getValues() {
        return this.apiCallGet()
            .then(response => {
                if (typeof response.errorResponse == 'undefined') {
                    const result = response[Object.keys(response)[0]];

                    let state = result.on;
                    if (typeof this.state === 'undefined' || this.state !== state) {
                        this.state = state;
                        this.setCapabilityValue('onoff', this.state);
                    };

                    let lightHue = Math.round(1 / 360 * (parseInt(result.color.split(';')[0])) * 100) / 100;
                    if (typeof this.lightHue === 'undefined' || this.lightHue !== lightHue) {
                        this.lightHue = lightHue;
                        this.setCapabilityValue('light_hue', this.lightHue);
                    };
                    let lightSaturation = parseInt(result.color.split(';')[1]) / 100;
                    if (typeof this.lightSaturation === 'undefined' || this.lightSaturation !== lightSaturation) {
                        this.lightSaturation = lightSaturation;
                        this.setCapabilityValue('light_saturation', this.lightSaturation);
                    };
                    let dim = parseInt(result.color.split(';')[2]) / 100;
                    if (typeof this.dim === 'undefined' || this.dim !== dim) {
                        this.dim = dim;
                        this.setCapabilityValue('dim', this.dim);
                    };
                    let measurePower = Math.round(result.power * 10) / 10;
                    if (typeof this.measurePower === 'undefined' || this.measurePower !== measurePower) {
                        this.measurePower = measurePower;
                        // this.setCapabilityValue('measure_power', this.measurePower);
                    };
                    // this.log(`device ${this.getName()} refreshed`);
                    this.setAvailable();
                } else {
                    this.log(`[${this.getName()}] ${response.toString()}`);
                    this.setUnavailable(`Response error ${response.errorResponse.code}`);
                };
            })
            .catch(err => {
                this.error('Failed to get values', err.stack);
                this.setUnavailable(err);
                throw err;
            });
    };
}
