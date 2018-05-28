'use strict';

module.exports = class Player {
    constructor(id, nickname, profilePicture, spark) {
        if (!typeof id === 'string') throw new TypeError('Player.id parameter must be of type: String');
        if (!typeof nickname === 'string') throw new TypeError('Player.nickname parameter must be of type: String');
        if (!typeof profilePicture === 'string') throw new TypeError('Player.profilePicture parameter must be of type: String');
        if (!typeof spark === 'object') throw new TypeError('Player.park parameter must be of type: Object');

        this.id = id;
        this.nickname = nickname;
        this.profilePicture = profilePicture;
        this.spark = spark;
        this.onBreak = false;
        this.isCzar = false;
        this.score = 0;
        this.hand = [];
    }

    reset() {
        this.onBreak = false;
        this.score = 0;
        this.hand = [];
    }

    send(message) {
        this.spark.write(message);
    }

    display() {
        console.log('Player:', JSON.stringify(this.id, this.spark.id, this.nickname));
    }
};