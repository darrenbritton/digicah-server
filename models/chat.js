

const Message = require('./message');

module.exports = class Chat {
  constructor() {
    this.log = [];
  }

  send(message, users) {
    if (!(message instanceof Message)) throw new TypeError('Chat.push: message parameter must be instance of: Message');

    const data = {action: 'chat.message', payload: message};
    users.forEach((user) => {
      user.spark.write(data);
    });
  }

  display() {
    console.log('Chat:', JSON.stringify(this.log));
  }
};
