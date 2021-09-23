const express = require("express");
const bodyParser = require('body-parser')
const cors = require('cors')
const sessions = require('express-session');
const httpContext = require('express-http-context');
const path = require('path');
const nunjucks = require('nunjucks');
const { v4: uuid } = require('uuid');

const logger = require('./src/utils/Logger');
const Boss = require('./src/Managers/BossManager');
const User = require('./src/Managers/UserManager');
const Crypto = require('./src/Managers/CryptoManager');
const MongoDB = require('./src/Connectors/MongoConnector');
const Token = require('./src/Managers/TokenManager');
const Oauth = require('./src/Managers/OauthManager');
const Errors = require("./src/utils/Errors");

const app = express();

app.use(bodyParser.json());
app.use(cors());
app.use(httpContext.middleware);
app.use(sessions({
  cookie: {
    maxAge: Number(process.env.SESSION_DURATION),
  },
  proxy: true,
  resave: false,
  saveUninitialized: true,
  secret: process.env.SESSION_SECRET || '',
}));

app.use(express.static(path.join(__dirname, 'public')));

nunjucks.configure(path.join(__dirname, './public'), {
  autoescape: true,
  express: app,
});

function checkUserSession(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.redirect('/');
}

async function isValidToken(req, res, next) {
  let token = req.header('authorization');
  try {
    res.locals.validToken = Token.validateToken(token, req.params.id);
  } catch (err) {
    return res.json(response({}, "", err.code, err.message))
  }
  return next();
}

function traceRequest(req, res, next) {
  httpContext.set('uuid', uuid());
  const data = {
    ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    user: req.params.id,
    data: {
      headers: req.headers,
      method: req.method,
      url: req.url,
      httpVersion: req.httpVersion,
      body: req.body,
      cookies: req.cookies,
      path: req.path,
      protocol: req.protocol,
      query: req.query,
      hostname: req.hostname,
      ip: req.ip,
      originalUrl: req.originalUrl,
      params: req.params,
    },
    service: req.route.path,

  }
  logger.Info(data);
  return next();
}

async function updateLastJoin(req, res, next) {
  let id = req.params.id;
  await User.UpdateLastJoin(id, req.ip);
  return next();
}

function checkIsFighting(req, res, next) {
  Boss.isFighting(req.params.id) ? next() : res.json(response(null, null, Errors.ERROR_IsFigthing().code, Errors.ERROR_IsFigthing()));
}

function checkIsNotFighting(req, res, next) {
  !Boss.isFighting(req.params.id) ? next() : res.json(response(null, null, Errors.ERROR_IsFigthing().code, Errors.ERROR_IsFigthing()));
}

app.get('/login/:id', traceRequest, async function (req, res) {
  try {
    const id = req.params.id;
    const user = await User.login(id);
    if (!user) throw Errors.INVALID_LOGIN();
    return res.json(response(user, Token.createToken(id), 200, ""));
  } catch (err) {
    return res.json(response({}, "", err.code, err.message))
  }

});

app.get('/statusboss/:id', traceRequest, isValidToken, updateLastJoin, function (req, res) {
  try {
    return res.json(response(Boss.getStatus(), res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.get('/refreshdata/:id', traceRequest, isValidToken, updateLastJoin, async function (req, res) {
  try {
    const user = await User.refreshData(req.params.id);
    if (!user) throw Errors.INVALID_LOGIN();
    return res.json(response(user, res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response({}, "", err.code, err.message))
  }
});

app.get('/joinbattle/:id', traceRequest, isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  try {
    const userHasJoinedBattle = await User.joinBattle(req.params.id);
    return res.json(response(userHasJoinedBattle, res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(false, "", err.code, err.message))
  }
});

app.get('/leftBattle/:id', traceRequest, isValidToken, checkIsFighting, updateLastJoin, async function (req, res) {
  try {
    const userHasLeftBattle = await User.leftBattle(req.params.id);
    return res.json(response(userHasLeftBattle, res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(false, "", err.code, err.message))
  }
});

app.post('/forge/:id', traceRequest, isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  const mainWeaponId = req.body.mainWeapon;
  const secondaryWeaponId = req.body.secondaryWeapon;
  try {
    const newWeapon = await User.forge(req.params.id, mainWeaponId, secondaryWeaponId);
    if (!newWeapon) throw Errors.INVALID_FORGE();
    return res.json(response(newWeapon, res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.post('/extract/:id', traceRequest, isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {

  try {
    const destWeapon = req.body.destWeapon;
    const sourceWeapon = req.body.sourceWeapon;
    const newWeapon = await User.extract(req.params.id, destWeapon, sourceWeapon);
    if (!newWeapon) throw Errors.INVALID_EXTRACT();
    return res.json(response(newWeapon, res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.post('/equip/:id', traceRequest, isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  try {
    const weapon = req.body.weapon;
    const isEquippedWeapon = await User.equipWeapon(req.params.id, weapon);
    if (!isEquippedWeapon) throw Errors.INVALID_EQUIP();
    return res.json(response(isEquippedWeapon, res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.post('/refer/:id', traceRequest, isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  try {
    return res.json(response(await User.refer(req.params.id, req.body.code), res.locals.validToken, 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.get('/auth', traceRequest, async function (req, res) {
  const { code, state } = req.query;
  const options = {
    code,
  };
  const user = await Oauth.validateOauth(options, state);
  session = req.session;
  session.userId = Crypto.encrypt(user._id.toString());
  return res.redirect('/home');
});

app.get('/home', traceRequest, checkUserSession, async function (req, res) {
  const user = await User.getUser(Crypto.decrypt(req.session.userId));
  return res.render('html/hub.html', {
    user,
  });
});

app.get('/authUrl/:id', traceRequest, async function (req, res) {
  try {
    return res.status(200).json(response(await Oauth.generateUrl(req.params.id), "", 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.get('/checkAuth/:id', traceRequest, async function (req, res) {
  try {
    const user = await Oauth.checkAuth(req.params.id);
    if (!user) throw Errors.ERROR_ATH_CHECKOUT();
    return res.json(response(user, Token.createToken(user._id), 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.post('/nickname/:id', traceRequest, isValidToken, checkIsNotFighting, updateLastJoin, async function (req, res) {
  try {
    return res.json(response(await User.changeNickname(req.params.id, req.body.nickname), Token.createToken(req.params.id), 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.post('/claim/:id', traceRequest, isValidToken, updateLastJoin, async function (req, res) {
  try {
    return res.json(response(await User.claim(req.params.id), Token.createToken(req.params.id), 200, ""));
  } catch (err) {
    return res.json(response(null, null, err.code, err.message));
  }
});

app.get('/', (req, res) => {
  if (req.session && req.session.id) {
    return res.redirect('/home');
  } else {
    return res.redirect(process.env.WANDLORD_WEBSITE);
  }
});

app.use((req, res) => {
  res.redirect(process.env.WANDLORD_WEBSITE);
});

app.get('/logout', traceRequest, function (req, res) {
  req.session.destroy();
  res.redirect(process.env.WANDLORD_WEBSITE);
});

app.listen(3000, async function () {
  try {
    await MongoDB.connect();
    await Boss.start();
    console.log("El servidor está inicializado en el puerto 3000");
  } catch (err) {
    console.log(err);
  }
});

function response(_data, _token, _status, _error) {
  const resp = {
    Data: _data,
    Token: _token,
    Status: _status,
    Error: _error
  }
  if (_status != 200) {
    logger.Error({ data: resp, service: "response" });

  } else {
    logger.Info({ data: resp, service: "response" });
  }
  return resp;
}