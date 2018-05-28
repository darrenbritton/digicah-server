'use strict';

//
// Require all dependencies.
//
const express = require('express');
const expressSession = require('express-session');
const redis = require('redis');
const RedisStore = require('connect-redis')(expressSession);
const cookieParser = require('cookie-parser');
const http = require('http');
const Primus = require('primus');
const primusSession = require('./session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

const Secrets = require('./.secrets');

const Game = require('./models/game');
const Message = require('./models/message');
const Player = require('./models/player');

const Games = [];

passport.use(new GoogleStrategy({
        clientID: Secrets.google.id,
        clientSecret: Secrets.google.secret,
        callbackURL: "/auth/google/callback"
    }, async (accessToken, refreshToken, profile, done) => {
    done(null, profile);
}));

//
// Create an Express application.
//
const app = express();

//
// Configure and save a reference to the `cookie-parser` middleware so we can
// reuse it in Primus.
//
const secret = Secrets.appSecret || Math.random().toString(36);
const cookies = cookieParser(secret);

/* redis */
const host = process.env.REDIS_HOST || '127.0.0.1';
const port = 6379;
const client = redis.createClient(port,host);
const store = new RedisStore({
    client,
    ttl: 15768000
});

client.on('connect', function() {
    console.log(`redis connected - ${host}:${port}`);
});

//
// Add the middleware needed for session support.
//
app.use(cookies);
app.use(expressSession({
    saveUninitialized: true,
    secret: secret,
    resave: true,
    store: store
}));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
    // placeholder for custom user serialization
    // null is for errors
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    // placeholder for custom user deserialization.
    // null is for errors
    done(null, user);
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/callback',
    passport.authenticate('google'),
    function(req, res) {
        // Successful authentication, redirect home.
        res.redirect('//localhost:3000/play');
    });

app.get('/', function index(req, res) {
  //
  // Every time that we visit the index page we update the session with a new
  // timestamp.
  //
  req.session.timestamp = Date.now();
  res.sendFile(__dirname + '/index.html');
});

app.get('/logout', function(req, res){
    const { user: player } = req.session.passport;
    if (player) {
        Games.forEach((game, i) => {
            if (game.isPlayer(player.id)) {
                game.players.splice(i, 1);
                primus.write({action: 'save.lobbies', payload: Games});
            }
        });
    }
    req.logout();
    res.redirect('//localhost:3000');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.status(401).send({ error: 'Unauthenticated' })
}

app.get('/protected', ensureAuthenticated, function(req, res) {
    res.send("access granted");
});

const newGame = new Game('thunderdome', ['base']);
Games.push(newGame);

//
// Create an HTTP server and our Primus server.
//
const server = http.createServer(app)
  , primus = new Primus(server);

//
// Here we add the `cookie-parser` middleware and our session middleware. The
// first will populate `req.signedCookies` and the second `req.session` for the
// requests captured by Primus.
//
primus.use('cookies', cookies);
primus.use('session', primusSession, { store: store });

const cardsFolder = './cards/white';
const fs = require('fs');
const Cardpacks = [];

fs.readdirSync(cardsFolder).forEach(filename => {
    Cardpacks.push(filename.split('.')[0]);
});

primus.on('connection', function connection(spark) {
  if(spark.request.session.passport && spark.request.session.passport.user) {
    const { user } = spark.request.session.passport;
    const player = new Player(user.id, user.displayName, user.photos[0].value, spark);
    spark.write({action: 'save.player', payload: player});
    spark.write({action: 'save.lobbies', payload: Games});
    spark.write({action: 'save.cardpacks', payload: Cardpacks});
    Games.forEach(game =>{
      if (game.isPlayer(player.id)) {
          spark.write({action: 'player.joinGame', payload: { id: game.id}});
      }
    });
    spark.on('data', function (event) {
      const { payload } = event;
      switch(event.type) {
        case 'chat.message':
          Games.forEach(game => {
            if(game.isPlayer(player.id)) {
              const message = new Message(player.nickname, player.id, player.profilePicture, payload.text);
              game.chat.send(message, game.players);
            }
          });
          break;
        case 'notify.generic':
          primus.write({action: event.type, payload: event.payload});
          break;
        case 'player.joinGame':
            const game = Games.find(game => game.id === payload.id);
            if (game) {
                game.join(player);
            }
            break;
          case 'game.create':
            Games.push(new Game(payload.name, payload.cardpacks, player.nickname, payload.password));
            spark.write({action: 'save.lobbies', payload: Games});
            break;
      }
    });
  }
});

// primus.on('disconnection', function (spark) {
//     if(spark.request.session.passport && spark.request.session.passport.user) {
//         const {user: player} = spark.request.session.passport;
//         Games.forEach((game, i) => {
//             if (game.isPlayer(player.id)) {
//                 game.players.splice(i, 1);
//                 primus.write({action: 'save.lobbies', payload: Games});
//             }
//         });
//     }
// });

//
// Begin accepting connections.
//
server.listen(8080, function listening() {
  console.log('Open http://localhost:8080 in your browser');
});
