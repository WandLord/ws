const express = require("express");
const logger = require('./Connectors/LoggerConnector');
const Boss = require('./Managers/BossManager');
const User = require('./Managers/UserManager');
const PARAMS = require('./Constants');
const MongoDB = require('./Connectors/MongoConnector');
const Token = require('./Managers/TokenManager');
const bodyParser = require('body-parser')
const cors = require('cors')

const app = express();
app.use(bodyParser.json());
app.use(cors());

app.get('/login/:id', async function (req, res) {
  let id = req.params.id;
  const user = await User.login(id);
  if (!user) {
    res.json(response({}, "", 201, "Invalid Login"))
  } else {
    res.json(response(user, Token.createToken(id), 200, ""));
  }
});

async function isValidToken(req, res, next) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let token = req.header('authorization');
  res.locals.validToken = Token.validateToken(token, req.params.id);
  return res.locals.validToken ? next() : res.json(response({}, "", 202, "Invalid Token"));
}

function checkIsFighting(req, res, next) {
  Boss.isFighting(req.params.id) ? next() : res.json(response(null, null, 300, "No esta en pelea pero llega la request."));
}

function checkIsNotFighting(req, res, next) {
  !Boss.isFighting(req.params.id) ? next() : res.json(response(null, null, 300, "Esta en pelea pero llega la request."));
}

app.get('/statusboss/:id', isValidToken, checkIsFighting, function (req, res) {
  res.json(response(Boss.Status(), res.locals.validToken, 200, ""));
});

app.get('/refreshdata/:id', isValidToken, checkIsNotFighting, async function (req, res) {
  const refreshedUser = await User.refreshData(req.params.id);
  res.json(response(refreshedUser, res.locals.validToken, 200, ""));
});

app.get('/joinbattle/:id', isValidToken, checkIsNotFighting, async function (req, res) {
  const userHasJoinedBattle = await User.joinBattle(req.params.id);
  res.json(response(userHasJoinedBattle, res.locals.validToken, 200, ""));
});

app.get('/leftBattle/:id', isValidToken, checkIsFighting, async function (req, res) {
    const userHasLeftBattle = await User.leftBattle(req.params.id);
    res.json(response(userHasLeftBattle, res.locals.validToken, 200, ""));
});

app.post('/forge/:id', isValidToken, checkIsNotFighting, async function (req, res) {
  var mainWeaponId = req.body.mainWeapon;
  var secondaryWeaponId = req.body.secondaryWeapon;
  
  const newWeapon = await User.forge(req.params.id, mainWeaponId, secondaryWeaponId);
    if (newWeapon) {
      res.json(response(newWeapon, res.locals.validToken, 200, ""));
    }
    else {
      res.json(response(newWeapon, res.locals.validToken, 300, "INTENTO DE FORJA SOSPECHOSO"));
    }  
});

app.post('/extract/:id', isValidToken, checkIsNotFighting, async function (req, res) {
  var destWeapon = req.body.destWeapon;
  var sourceWeapon = req.body.sourceWeapon;

  const newWeapon = await User.extract(req.params.id, destWeapon, sourceWeapon);
  if (newWeapon) {
    res.json(response(newWeapon, res.locals.validToken, 200, ""));
  } else {
    res.json(response(newWeapon, res.locals.validToken, 300, "INTENTO DE EXTRACT SOSPECHOSO"));
  }
});

app.options('/register/:id', cors());

app.post('/register/:id', cors(), async function (req, res) {
  var name = req.body.name;
  const isUserCreated = await User.createUser(req.params.id, name);
  if (isUserCreated) {
    res.json(response(isUserCreated, "", 200, ""));
  } else {
    res.json(response(isUserCreated, "", 203, "USER EXIST O USER NAME EXIST"));
    //TODO USER EXIST O USER NAME EXIST
  }
});

app.post('/equip/:id', isValidToken, checkIsNotFighting, async function (req, res) {
  var weapon = req.body.weapon;
  
  const isEquippedWeapon = await User.equipWeapon(req.params.id, weapon);
  if (isEquippedWeapon) {
      res.json(response(isEquippedWeapon, res.locals.validToken, 200, ""));
  } else {
    //TODO EQUIPAR ARMA QUE NO ESTA EN EL INVENTARIO
    res.json(response(isEquippedWeapon, res.locals.validToken, 300, "Intento de equipar un arma que no tiene"));
  }
});

app.post('/refer/:id', isValidToken, checkIsNotFighting, async function (req, res) {
  var code = req.body.code;
  const isReferred = await User.refer(req.params.id, code);
  res.json(response(isReferred, res.locals.validToken, 200, ""));
});

app.use((req, res) => {
  console.log('Hello Wereld');
  //TODO Intentando llamar a un servicio inexistente
  res.status(404).send({ message: 'Not Found', path: req.originalUrl })
})

app.listen(3000, async function () {
  console.log("El servidor está inicializado en el puerto 3000");
  try {
    await MongoDB.connect();
    await Boss.start();
  } catch (e) {
    console.log('Error: ', e);
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