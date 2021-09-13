const express = require("express");
const logger = require('./src/utils/Logger');
const Boss = require('./src/Managers/BossManager');
const User = require('./src/Managers/UserManager');
const Crypto = require('./src/Managers/CryptoManager');
const MongoDB = require('./src/Connectors/MongoConnector');
const Token = require('./src/Managers/TokenManager');
const bodyParser = require('body-parser')
const cors = require('cors')
const Oauth = require('./src/Managers/OauthManager');
const sessions = require('express-session');
const dotenv = require('dotenv');
const path = require('path');
const { ERRORS } = require("./src/utils/Errors");

const app = express();
dotenv.config();

app.use(bodyParser.json());
app.use(cors());
app.use(sessions({
  cookie: {
    maxAge:  Number(process.env.SESSION_DURATION),
  },
  proxy: true,
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET || '',
}));

app.use(express.static(__dirname + 'public'))

function checkUserSession(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/');
}

async function isValidToken(req, res, next) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let token = req.header('authorization');
  try {
    res.locals.validToken = Token.validateToken(token, req.params.id);
  } catch (e) {
    res.json(response({}, "", ERRORS.TOKEN_VALIDATION.CODE, ERRORS.TOKEN_VALIDATION.MSG))
  }
  return next();
}

async function updateLastJoin(req, res, next) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  await User.UpdateLastJoin(id, ip);
  return next();
}

function checkIsFighting(req, res, next) {
  Boss.isFighting(req.params.id) ? next() : res.json(response(null, null, 300, "No esta en pelea pero llega la request."));
}

function checkIsNotFighting(req, res, next) {
  !Boss.isFighting(req.params.id) ? next() : res.json(response(null, null, 300, "Esta en pelea pero llega la request."));
}

app.get('/login/:id', async function (req, res) {
  let id = req.params.id;
  const user = await User.login(id);
  if (!user) {
    res.json(response({}, "", 201, "Invalid Login"))
  } else {
    res.json(response(user, Token.createToken(id), 200, ""));
  }
});

app.get('/statusboss/:id', isValidToken, updateLastJoin, function (req, res) {
  res.json(response(Boss.getStatus(), res.locals.validToken, 200, ""));
});

app.get('/refreshdata/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  const refreshedUser = await User.refreshData(req.params.id);
  res.json(response(refreshedUser, res.locals.validToken, 200, ""));
});

app.get('/joinbattle/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  const userHasJoinedBattle = await User.joinBattle(req.params.id);
  res.json(response(userHasJoinedBattle, res.locals.validToken, 200, ""));
});

app.get('/leftBattle/:id', isValidToken, checkIsFighting, updateLastJoin, async function (req, res) {
  const userHasLeftBattle = await User.leftBattle(req.params.id);
  res.json(response(userHasLeftBattle, res.locals.validToken, 200, ""));
});

app.post('/forge/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  var mainWeaponId = req.body.mainWeapon;
  var secondaryWeaponId = req.body.secondaryWeapon;
  try {
    const newWeapon = await User.forge(req.params.id, mainWeaponId, secondaryWeaponId);
    res.json(response(newWeapon, res.locals.validToken, 200, ""));
  } catch (e) {
    res.json(response(null, null, ERRORS.INVALID_FORGE.CODE, ERRORS.INVALID_FORGE.MSG));
  }
});

app.post('/extract/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  var destWeapon = req.body.destWeapon;
  var sourceWeapon = req.body.sourceWeapon;
  try {
    const newWeapon = await User.extract(req.params.id, destWeapon, sourceWeapon);
    res.json(response(newWeapon, res.locals.validToken, 200, ""));
  } catch (e) {
    res.json(response(null, null, ERRORS.INVALID_EXTRACT.CODE, ERRORS.INVALID_EXTRACT.MSG));
  }
});

app.post('/equip/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  var weapon = req.body.weapon;

  const isEquippedWeapon = await User.equipWeapon(req.params.id, weapon);
  if (isEquippedWeapon) {
    res.json(response(isEquippedWeapon, res.locals.validToken, 200, ""));
  } else {
    res.json(response(isEquippedWeapon, res.locals.validToken, 300, "Intento de equipar un arma que no tiene"));
  }
});

app.post('/refer/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  res.json(response(await User.refer(req.params.id, req.body.code), res.locals.validToken, 200, ""));
});

app.get('/auth', async function (req, res) {
  const { code, state } = req.query;
  const options = {
    code,
  };

  await Oauth.validateOauth(options, state);
  session = req.session;
  session.userId = Crypto.ofuscateId(state);
  // use in 
  res.redirect('/home');
});

app.get('/home', checkUserSession, async function (req, res) {
  res.sendFile(path.join(__dirname, './public', 'hub.html'));
});

app.get('/authUrl/:id', async function (req, res) {
  
  res.status(200).json(response(await Oauth.generateUrl(req.params.id), "", 200, ""));
});

app.get('/checkAuth/:id', async function (req, res) {
  const user = await Oauth.checkAuth(req.params.id);
  res.json(response(user, Token.createToken(user._id), 200, ""));
});

app.post('/nickname/:id', isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  res.json(response(await User.changeNickname(req.params.id, req.body.nickname), Token.createToken(req.params.id), 200, ""));
});

app.use((req, res) => {
  console.log('Hello Wereld');
  //TODO Intentando llamar a un servicio inexistente
  res.status(404).send({ message: 'Not Found', path: req.originalUrl })
});

app.get('/logout', function (req, res) {
  req.session.destroy();
  res.redirect('/');
});

app.listen(3000, async function () {
  console.log("El servidor está inicializado en el puerto 3000");
  try {
    logger.SystemInfo({method: "Start", payload: "El servidor está inicializado en el puerto 3000"});
    await MongoDB.connect();
    await Boss.start();
  } catch (e) {
    console.log(response(null, null, ERRORS.DB_CONNECTION.CODE, ERRORS.DB_CONNECTION.MSG));
    process.exit(1);
  }
});

function response(_data, _token, _status, _error) {
  var resp = {
    Data: _data,
    Token: _token,
    Status: _status,
    Error: _error
  }
  return resp;
}