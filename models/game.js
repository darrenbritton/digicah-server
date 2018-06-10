

const {readFileSync} = require('jsonfile');
const uuidv4 = require('uuid/v4');
const path = require('path');
const timeoutPromise = require('timeout-then');
const delay = require('delay');

const Reference = require('./reference');
const Chat = require('./chat');
const Deck = require('./deck');
const Round = require('./round');

module.exports = class Game {
  constructor(name, cardpacks, creator = 'none', password = '', scoreLimit = 10, waitForPlayers = false, handSize = 10, timeout = 30, maxPlayers = 10) {
    this.id = uuidv4();
    this.name = name;
    this.password = password;
    this.hasPassword = !!password;
    this.cardpacks = cardpacks;
    this.creator = creator;
    this.scoreLimit = scoreLimit;
    this.waitForPlayers = waitForPlayers;
    this.maxPlayers = maxPlayers;
    this.handSize = handSize;
    this.timeout = timeout * 1000;

    this.chat = new Chat();
    this.lastCzar = -1;
    this.judging = false;
    this.currentRound = {blackCard: {text: ''}};
    this.players = [];
    this.whiteDeck = [];
    this.blackDeck = [];

    this.timer = null;
  }

  start() {
    this.resetPlayers();
    this.lastCzar = -1;
    this.currentRound = {blackCard: {text: ''}};
    this.populateDecks();
    this.newRound();
  }

  resetPlayers() {
    this.players.forEach((player) => player.reset());
  }

  populateDecks() {
    this.whiteDeck = new Deck([]);
    this.blackDeck = new Deck([]);
    this.cardpacks.forEach((cardpack) => {
      const cards = Reference.getDeck(cardpack);
      this.whiteDeck.add(cards.white);
      this.blackDeck.add(cards.black);
    });
    this.whiteDeck.shuffle();
    this.blackDeck.shuffle();
  }

  isPlayer(id) {
    return !!this.players.find((player) => player.id === id);
  }

  async join(player) {
    if (!this.players.find((i) => i.id === player.id)) {
      this.players.push(player);
      this.sendToPlayers({action: 'game.update', payload: this.nonPrivate()});
    }
    if (this.creator === 'none' && this.players.length > 1) {
      const data = {action: 'notify.generic', payload: {text: 'Game is starting...'}};
      this.sendToPlayers(data);
      await delay(3000);
      this.newRound();
    }
  }

  sendToPlayers(event) {
    this.players.forEach((player) => {
      player.spark.write(event);
    });
  }

  populateHand(player) {
    while (player.hand.length !== this.handSize) {
      if (this.whiteDeck.length() === 0) {
        this.populateDecks();
      } else {
        player.hand.push(this.whiteDeck.pop());
      }
    }
  }

  newRound() {
    if (this.lastCzar === -1) {
      this.populateDecks();
    }

    this.judging = false;
    let roundPlayers = this.players.filter((player) => !player.onBreak);

    if (this.players[this.lastCzar]) this.players[this.lastCzar].isCzar = false;
    this.lastCzar++;
    if (this.lastCzar === roundPlayers.length) this.lastCzar = 0;
    this.players[this.lastCzar].isCzar = true;
    roundPlayers = roundPlayers.filter((player) => player.id !== this.players[this.lastCzar].id);
    this.players.forEach((player) => this.populateHand(player));
    if (this.blackDeck.length() === 0) {
      this.populateDecks();
    }
    this.currentRound = new Round(this.players[this.lastCzar], this.blackDeck.pop(), roundPlayers);
    this.sendToPlayers({action: 'notify.generic', payload: {text: `${this.players[this.lastCzar].nickname} is the Card Czar for this round`}});
    this.sendToPlayers({action: 'game.newRound', payload: this.currentRound.nonPrivate()});
    this.players.forEach((player) => player.spark.write({
      action: 'save.hand',
      payload: player.hand,
    }));

    this.timer = timeoutPromise(this.timeout);
    this.timer.then(() => {
      this.currentRound.players.forEach((player) => {
        if (!player.isCzar && this.currentRound.submissions.get(this.currentRound.submissionReverseMap.get(player.id)).length !== this.currentRound.cardsToBeSubmitted) {
          player.onBreak = true;
          player.hand.forEach((card) => card.played = false);
          const playerIndex = this.currentRound.players.findIndex((roundPlayer) => player.id == roundPlayer.id);
          this.currentRound.players.splice(playerIndex, 1);
        }
      });
      this.sendToPlayers({action: 'game.update', payload: this.nonPrivate()});
      this.startJudging();
    });
  }

  async endRound() {
    const roundWinner = this.players.find((player) => player.id === this.currentRound.winner);
    roundWinner.score++;
    this.currentRound.players.forEach((player) => player.hand = player.hand.filter((card) => !card.played));
    this.sendToPlayers({action: 'notify.generic', payload: {text: `${roundWinner.nickname} Has won this round!`}});
    await delay(1000);
    if (roundWinner.score === this.scoreLimit) {
      this.sendToPlayers({action: 'notify.generic', payload: {text: `${roundWinner.nickname} Has won the game!`}});
      await delay(3000);
      this.sendToPlayers({action: 'notify.generic', payload: {text: `New game starting in this lobby...`, action: 'game.leave'}});
      await delay(3000);
      this.start();
    } else {
      this.newRound();
    }
  }

  submitCard(player, handIndex) {
    const {currentRound: round} = this;
    const submission = round.submissions.get(round.submissionReverseMap.get(player.id));
    if (submission.length < round.cardsToBeSubmitted) {
      const card = player.hand[handIndex];
      if (card) {
        card.play();
        submission.push(card.text);
        round.submissions.set(round.submissionReverseMap.get(player.id), submission);
        let submissionsComplete = true;
        round.submissions.forEach((value) => {
          if (value.length < round.cardsToBeSubmitted) {
            submissionsComplete = false;
          }
        });
        if (submissionsComplete) {
          if (this.timer) {
            this.timer.clear();
          }
          this.startJudging();
        }
      }
    }
  }

  startJudging() {
    this.judging = true;
    this.currentRound.cardCzar.spark.write({
      action: 'czar.judge',
      payload: Round.mapToObject(this.currentRound.submissions),
    });
    this.sendToPlayers({action: 'game.judging', payload: {}});
  }

  nonPrivate() {
    const {
      password,
      whiteDeck,
      blackDeck,
      currentRound,
      ...nonPrivate
    } = this;
    nonPrivate.currentRound = this.currentRound.nonPrivate ? this.currentRound.nonPrivate(): this.currentRound;
    nonPrivate.players = this.players.map((player) => player.nonPrivate());
    return nonPrivate;
  }

  display() {
    console.log('Game:', JSON.stringify(this.name, this.cardpacks, this.creator, this.scoreLimit, this.waitForUsers, this.handSize, this.timeout, this.lastCzar));
  }
};
