const expect = require('chai').expect;

const Game = require('../game');
const Deck = require('../deck');
const Card = require('../card');

describe("Game Instance", function() {
    describe("Start a Game", function() {
        it("should populate decks correctly based on cardpacks", function() {
            const game = new Game('testGame', ['base', 'internet']);
            game.populateDecks();
            expect(game.whiteDeck).to.be.instanceof(Deck);
            expect(game.blackDeck).to.be.instanceof(Deck);
            expect(game.whiteDeck.length()).to.be.equal(602);
            expect(game.blackDeck.length()).to.be.equal(130);
            expect(game.whiteDeck.pop()).to.be.instanceof(Card);
            expect(game.blackDeck.pop()).to.be.instanceof(Card);
        });
    });
});