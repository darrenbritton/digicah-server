'use strict';

//
// Require all dependencies.
//
const express = require('express');
const expressSession = require('express-session');
const RedisStore = require('connect-redis')(expressSession);
const cookieParser = require('cookie-parser');
const http = require('http');
const Primus = require('primus');
const primusSession = require('./session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20');

const Secrets = require('./.secrets');

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

//
// Since this is only an example, we will use the `MemoryStore` to store the
// sessions. This is our session store instance.
//
const store = new RedisStore({
    host: 'localhost',
    port: 32769,
    ttl: 15768000
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
        res.redirect('/');
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
    console.log('logging out');
    req.logout();
    res.redirect('/');
});

function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) { return next(); }
    res.redirect('/')
}

app.get('/protected', ensureAuthenticated, function(req, res) {
    res.send("access granted:", req.session);
});

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

primus.on('connection', function connection(spark) {
  //
  // Our session data can now be read from `spark.request.session`.
  //
  spark.write(JSON.stringify(spark.request.session, null, '  '));
});

//
// Begin accepting connections.
//
server.listen(8080, function listening() {
  console.log('Open http://localhost:8080 in your browser');
});
