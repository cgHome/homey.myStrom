"use strict";

const Homey = require("homey");

// ToDo
// const apiAuthorizationPublic = !(Homey.ManagerSettings.get('httpSettings') === null ? true : Homey.ManagerSettings.get('httpSettings').apiAuthorization)
const apiAuthorizationPublic = true;

module.exports = [
  {
    description: "myStrom device generic action",
    method: "GET",
    path: "/deviceGenAction",
    public: apiAuthorizationPublic,
    fn: (args, callback) => {
      const result = Homey.emit("deviceActionReceived", args.query);
      if (result instanceof Error) return callback(result);
      return callback(null, result);
    },
  },
];
