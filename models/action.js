

const constants = require('../constants');

module.exports = class Action {
  constructor(type, payload) {
    if (constants.ACTION_TYPES.indexOf(searchStr) < 0) throw new TypeError(`Action.type property must one of enumerate: ${constants.ACTION_TYPES.join(',')}`);
    if (!typeof payload === 'object') throw new TypeError('Action.payload parameter must be of type: Object');

    this.type = type;
    this.payload = payload;
  }

  display() {
    console.log('Action:', JSON.stringify(this.type, this.payload));
  }
};
