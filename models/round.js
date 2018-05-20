'use strict';

module.exports = class Round {
    constructor(cardCzar, blackCard, players) {

        this.cardCzar = cardCzar;
        this.blackCard = blackCard;
        this.players = players;

        this.cardsToBeSubmitted = this.calculateCardsToBeSubmitted();
    }

    calculateCardsToBeSubmitted() {
        return (this.blackCard.text.match(/___/g) || []).length;
    }

    display() {
        console.log('Round:', JSON.stringify(this.cardCzar, this.blackCard, this.cardsToBeSubmitted, this.users));
    }
};