const cardsFolder = './cards';
const fs = require('fs');
const path = require('path');

class StaticDecks {
  constructor() {
    if (!StaticDecks.instance) {
      this._decks = {};
      this._cardpacks =[];

      this.populateCardpacks();
      this.populateDecks();
      StaticDecks.instance = this;
    }

    return StaticDecks.instance;
  }

  populateCardpacks() {
    fs.readdirSync(path.join(cardsFolder, '/white')).forEach((filename) => {
      this._cardpacks.push(filename.split('.')[0]);
    });
  }


  populateDecks() {
    this._cardpacks.forEach((cardpack) => {
      const white = JSON.parse(fs.readFileSync(path.join(cardsFolder, `/white/${cardpack}.json`))).cards;
      const black = JSON.parse(fs.readFileSync(path.join(cardsFolder, `/black/${cardpack}.json`))).cards;
      this._decks[cardpack] = {white, black};
    });
  }

  getCardpacks() {
    return this._cardpacks;
  }

  getDeck(cardpack) {
    return this._decks[cardpack];
  }
}

const instance = new StaticDecks();
module.exports = instance;
