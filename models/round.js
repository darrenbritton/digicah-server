

const uuidv4 = require('uuid/v4');

module.exports = class Round {
  constructor(cardCzar, blackCard, players) {
    this.cardCzar = cardCzar;
    this.blackCard = blackCard;
    this.players = players;

    this.submissionMap = new Map();
    this.submissionReverseMap = new Map();
    this.submissions = new Map();
    this.winner = null;

    this.cardsToBeSubmitted = this.calculateCardsToBeSubmitted();
    this.generateSubmissionMap();
  }

  calculateCardsToBeSubmitted() {
    return (this.blackCard.text.match(/___/g) || []).length;
  }

  generateSubmissionMap() {
    this.players.forEach((player) => {
      const obfuscatedKey = uuidv4();
      this.submissionMap.set(obfuscatedKey, player.id);
      this.submissionReverseMap.set(player.id, obfuscatedKey);
      this.submissions.set(obfuscatedKey, []);
    });
  }

  static mapToObject(map) {
    const obj = {};
    map.forEach((v, k) => {
      obj[k] = v;
    });
    return obj;
  }

  nonPrivate() {
    const {
      submissions,
      submissionMap,
      submissionReverseMap,
      ...nonPrivate
    } = this;
    nonPrivate.players = this.players.map((player) => player.nonPrivate());
    return nonPrivate;
  }

  display() {
    console.log('Round:', JSON.stringify(this.cardCzar, this.blackCard, this.cardsToBeSubmitted, this.users));
  }
};
