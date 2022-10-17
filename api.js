'use strict';

module.exports = {
  async deviceGenActionAPI({ homey, query }) {
    return homey.app.deviceGenActionAPI(query);
  },
};
