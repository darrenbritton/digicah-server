

module.exports = class Message {
  constructor(nickname, id, profilePicture, message) {
    this.nickname = nickname;
    this.id = id;
    this.profilePicture = profilePicture;
    this.message = message;

    this.timestamp = (Date.now());
  }

  display() {
    console.log('Message:', JSON.stringify(this.timestamp, this.message, this.nickname, this.id, this.profilePicture));
  }
};
