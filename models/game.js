'use strict';

const { readFileSync } = require('jsonfile');
const path = require('path');

const Chat = require('./chat');
const Deck = require('./deck');
const Round = require('./round');

module.exports = class Game {
    constructor(name, cardpacks, creator = 'none', password = '', scoreLimit = 10, waitForUsers = false, handSize = 10, timeout = 30) {

        this.name = name;
        this.password = password;
        this.cardpacks = cardpacks;
        this.creator = creator;
        this.scoreLimit = scoreLimit;
        this.waitForUsers = waitForUsers;
        this.handSize = handSize;
        this.timeout = timeout;

        this.chat = new Chat();
        this.lastCzar = -1;
        this.currentRound = null;
        this.players = [];
        this.whiteDeck = [];
        this.blackDeck = [];
    }

    start() {
        this.onBreak = false;
        this.score = 0;
        this.hand = [];
        this.populateDecks();
        this.newRound();
    }

    populateDecks() {
        this.whiteDeck = new Deck([]);
        this.blackDeck = new Deck([]);
        this.cardpacks.forEach(cardpack => {
            this.whiteDeck.add(readFileSync(path.join(__dirname,`../cards/white/${cardpack}.json`)).cards);
            this.blackDeck.add(readFileSync(path.join(__dirname,`../cards/black/${cardpack}.json`)).cards);
        });
        this.whiteDeck.shuffle();
        this.blackDeck.shuffle();
    }

    isPlayer(id) {
        return !!this.players.find(player => player.id === id);
    }

    newRound() {
        const roundPlayers = this.players.filter(player => !player.onBreak);

        this.lastCzar++;
        this.currentRound = new Round(roundPlayers[this.lastCzar % roundPlayers], this.blackDeck.pop(), roundPlayers);
    }

    display() {
        console.log('Game:', JSON.stringify(this.name, this.cardpacks, this.creator, this.scoreLimit, this.waitForUsers, this.handSize, this.timeout, this.lastCzar));
    }
};