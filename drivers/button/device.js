'use strict';

const Homey = require('homey');
const WebAPIDevice = require('homey-wifidriver').WebAPIDevice;

const backOffStrategy = {
    initialDelay: 10000, // 10 seconds
    maxDelay: 1000 * 60 * 60, // 1 hour
};

module.exports = class MyStromButton extends WebAPIDevice {
    async onInit(options) {
        await super.onInit()
            .catch(err => {
                this.error('error onInit', err.stack);
                return err;
            });

        this.log(`[${this.getName()}] (${this.getClass()}) device init`);
        
        // Register WEB-API events
        Homey.on('myStromButtonPressed', (data) => this.buttonPressed(data));

        this.setDefaultBaseUrl(`http://${this.getData().address}/api/v1/device/${this.getData().id}/`);
        this.setUnavailable(Homey.__('connecting'));

        this.setAvailable();
    };

    onAdded() {
        super.onAdded();
        this.configButton();
        this.log(`[${this.getName()}] (class: ${this.constructor.name}}) device added`);
    };

    onDeleted() {
        super.onDeleted();
        this.log(`[${this.getName()}] (class: ${this.constructor.name}}) device deleted`);
    };

    registerPollInterval() {
        super.registerPollInterval({
            id: this.getData().deviceName,
            fn: this.getValues.bind(this),
            interval: 5000, // 5 sec
        })
    };

    configButton() {
        Homey.ManagerCloud.getLocalAddress()
            .then(localAddress => {
                const ipAddress = localAddress.split(":")[0];
                const url = `get://${ipAddress}/api/app/ch.mystrom.smarthome/buttonPressed`;
                const config = `single=${url}/short&double=${url}/double&long=${url}/long&touch=${url}/touch`;

                return this.apiCallPost(config)
                    .then(response => {
                        this.getValues();
                    })
                    .catch(err => {
                        this.error('failed to config button', err.stack);
                        this.setUnavailable(err);
                        throw err;
                    });
            })
            .catch(err => {
                this.error('failed to get localAddress', err.stack);
                this.setUnavailable(err);
            });
    };

    buttonPressed(data) {
        if (data.address === this.getData().address) {
            this.log(`[${this.getName()}] ${data.button}-button pressed`);

            this.getDriver().flowCardTrigger
                .trigger(this, null, { button: data.button })
                .catch(this.error);
            
            // this.getValues();
        };
    };

    getValues() {
        return this.apiCallGet()
            .then(response => {
                if (typeof response.errorResponse == 'undefined') {
                    const result = response[Object.keys(response)[0]];

                    let measureVoltage = result.voltage;
                    if (typeof this.measureVoltage === 'undefined' || this.measureVoltage !== measureVoltage) {
                        this.measureVoltage = measureVoltage;
                        this.setCapabilityValue('measure_voltage', this.measureVoltage);
                    };
                    this.log(`[${this.getName()}] device refreshed`);
                    this.setAvailable();
                } else {
                    this.error(`[${this.getName()}] ${response.toString()}`);
                    // this.setUnavailable(`Response error ${response.errorResponse.code}`);
                };
            })
            .catch(err => {
                this.error(`[${this.getName()}] failed to get values ${err.stack}`);
                this.setUnavailable(err);
                throw err;
            });
    };

    apiCallPost(options, data) {
        let _options = typeof options === 'object' ? options : {};
        let _data = typeof options === 'string' ? options : data;

        if (typeof options === 'string' || typeof data === 'string') {
            _options['headers'] = { 'Content-Type': 'application/x-www-form-urlencoded' };
            if (typeof options === 'string') {
                _options['body'] = options;
            } else {
                _options['body'] = data;
            };
        };

        return super.apiCallPost(_options, _data)
    };
}
