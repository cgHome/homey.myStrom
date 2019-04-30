const Homey = require("homey");

// ToDo
// const apiAuthorizationPublic = !(Homey.ManagerSettings.get('httpSettings') === null ? true : Homey.ManagerSettings.get('httpSettings').apiAuthorization)
const apiAuthorizationPublic = true;

module.exports = [
	{
		description: "WIFI Button generic action",
		method: "GET",
		path: "/buttonGenAction",
		public: apiAuthorizationPublic,
		fn: function(args, callback) {
			const result = Homey.emit("myStromButtonGenAction", args.query);
			callback(null, result);
		}
	}
];
