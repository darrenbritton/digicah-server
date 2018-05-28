'use strict';

const { readFileSync } = require('jsonfile');
const uuidv4 = require('uuid/v4');
const path = require('path');

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
        this.timeout = timeout;

        this.chat = new Chat();
        this.lastCzar = -1;
        this.currentRound = { blackCard: { text: ''}};
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

    join(player) {
        if(!this.players.find(i => i.id === player.id)) {
            this.players.push(player);
            this.sendToPlayers({action: 'game.update', payload: this});

        }
        if (this.creator === 'none' && this.players.length > 1) {
            const data = {action: 'notify.generic', payload: {text: 'Game is starting...'}};
            this.sendToPlayers(data);
            setTimeout(() => {
               this.newRound();
            }, 3000);
        }
    }

    sendToPlayers(event) {
        this.players.forEach(player => {
            player.spark.write(event);
        });
    }

    populateHand(player) {
        while(player.hand.length !== this.handSize) {
            player.hand.push(this.whiteDeck.pop());
        }
    }

    newRound() {
        if(this.lastCzar === -1) {
            this.populateDecks();
        }

        const roundPlayers = this.players.filter(player => !player.onBreak);

        if (this.players[this.lastCzar]) this.players[this.lastCzar].isCzar = false;
        this.lastCzar++;
        if (this.lastCzar === roundPlayers.length - 1) this.lastCzar = 0;
        this.players[this.lastCzar].isCzar = true;
        this.players.forEach(player => this.populateHand(player));
        this.currentRound = new Round(roundPlayers[this.lastCzar % roundPlayers], this.blackDeck.pop(), roundPlayers);
        this.sendToPlayers({action: 'notify.generic', payload: {text: `${this.players[this.lastCzar].nickname} is the Card Czar for this round`}});
        this.sendToPlayers({action: 'game.update', payload: this});
    }

    display() {
        console.log('Game:', JSON.stringify(this.name, this.cardpacks, this.creator, this.scoreLimit, this.waitForUsers, this.handSize, this.timeout, this.lastCzar));
    }
};