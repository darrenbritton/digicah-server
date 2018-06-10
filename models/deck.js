

const Card = require('./card');

module.exports = class Deck {
  constructor(cards) {
    if (!Array.isArray(cards)) throw new TypeError('Decks.cards parameter must be of type: Array');

    this.cards = cards;
  }

  shuffle() {
    for (let i = this.cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
    }
  }

  add(cards) {
    cards.forEach((card) => this.cards.push(new Card(card.text)));
  }

  pop() {
    return this.cards.pop();
  }

  deal(numCards) {
    return this.cards.spliace(0, numCards);
  }

  length() {
    return this.cards.length;
  }

  merge(decks) {
    decks.forEach((deck) => this.cards.push(...deck.cards));
  }

  display() {
    console.log('Deck:', JSON.stringify(this.cards));
  }
};
