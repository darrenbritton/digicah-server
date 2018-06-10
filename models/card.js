

module.exports = class Card {
  constructor(text) {
    if (!typeof text === 'string') throw new TypeError('Card.text parameter must be of type: String');

    this.text = text;
    this.played = false;
  }

  play() {
    this.played = true;
  }

  display() {
    console.log('Card:', JSON.stringify(this.text));
  }
};
