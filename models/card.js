'use strict';

module.exports = class Card {
    constructor(text) {
        if (!typeof text === 'string') throw new TypeError('Card.text parameter must be of type: String');

        this.text = text;
    }

    display() {
        console.log('Card:', JSON.stringify(this.text));
    }
};