'use strict';

const Homey = require('homey');

// ToDo
const apiAuthorizationPublic = true;
// const apiAuthorizationPublic = !(Homey.ManagerSettings.get('httpSettings') === null ? true : Homey.ManagerSettings.get('httpSettings').apiAuthorization)

module.exports = [
  {
    description: 'WIFI Button pressed',
    method: 'GET',
    path: '/buttonPressed/:event',
    public: apiAuthorizationPublic,
    fn: function (args, callback) {
      // Homey.app.log(`WIFI Button pressed received ${args.params.event}`);
      Homey.emit('myStromButtonPressed', {
        "address": args.req.remoteAddress.replace(/^.*:/, ''),
        "button": args.params.event,
      });
      
      callback(null, 'OK')
    }
  }
]