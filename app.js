const express = require("express");
const logger = require('./Connectors/ConnectorELK');
const Boss = require('./Managers/ManagerBoss');
const User = require('./Managers/ManagerUsers');
const PARAMS = require('./Constants');
const MongoDB = require('./Connectors/ConnectorMongoDB');
const Token = require('./Managers/ManagerToken');

const OK = "OK";
const KO = "KO";
const app = express();
app.use(express.json());

app.get('/login/:id', function (req, res) {
  let id = req.params.id;
  User.login(id, function (resp) {
    if (resp == false) {
      res.send(response({}, "", 201, "Invalid Login"))
    }
    res.send(response(resp, Token.createToken(id), 200, ""));
  });
});

app.get('/statusboss/:id', function (req, res) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let token = req.header('authorization');
  let id = req.params.id;
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response({}, "", 202, "Invalid Token"))
  } else {
    if (Boss.isFithing(id)) {
      res.send(response(Boss.Status(), valid, 200, ""));
    } else {
      res.send(response(Boss.Status(), valid, 300, ""));
      //TODO No esta en pelea pero mira el estado del boss
    }
  }
});

app.get('/refreshdata/:id', function (req, res) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let token = req.header('authorization');
  let id = req.params.id;
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response({}, "", 202, "Invalid Token"))
  } else {
    if (!Boss.isFithing(id)) {
      User.refreshData(id, function (resp) {
        res.send(response(resp, valid, 200, ""));
      });
    } else {
      res.send(response({}, valid, 300, ""));
      //TODO ESTA PELEANDO Y ESTA REFRESCANDO EL USER DATA
    }
  }
});

app.get('/joinbattle/:id', function (req, res) {
  let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  let token = req.header('authorization');
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response(false, "", 202, "Invalid Token"))
  } else {
    if (!Boss.isFithing(id)) {
      User.joinBattle(id, function (result) {
        res.send(response(result, valid, 200, ""));
      });
    } else {
      res.send(response(false, valid, 300, ""));
      //TODO ESTA EN PELA PERO QUIERE VOLVER A ENTRAR
    }
  }
});

app.get('/leftBattle/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  let token = req.header('authorization');
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response(false, "", 202, "Invalid Token"))
  } else {
    if (Boss.isFithing(id)) {
      User.leftBattle(id, function (result) {
        res.send(response(result, valid, 200, ""));
      });
    } else {
      res.send(response(false, valid, 300, ""));
      //TODO SALIR DE LA PELEA AUNQUE NO ESTE EN PELEA
    }
  }
});

app.post('/forge/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  var weapon1 = req.body.weapon1;
  var weapon2 = req.body.weapon2;
  let token = req.header('authorization');
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response(false, "", 202, "Invalid Token"))
  } else {
    if (!Boss.isFithing(id)) {
      console.log("asada");
      User.forge(id, weapon1, weapon2, function (result) {
        res.send(response(result, valid, 200, ""));
      })
    } else {
      res.send(response(result, valid, 300, ""));
      //TODO FORGAR ARMA ESTANDO EN PELEA
    }
  }

});

app.post('/extract/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  var weapon1 = req.body.weapon1;
  var weapon2 = req.body.weapon2;
  let token = req.header('authorization');
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response(false, "", 202, "Invalid Token"))
  } else {
    if (!Boss.isFithing(id)) {
      User.extract(id, weapon1, weapon2, function (result) {
        res.send(response(result, valid, 200, ""));
      })
    } else {
      res.send(response(result, valid, 300, ""));
      //TODO EXTRAER ARMA ESTANDO EN PELEA
    }
  }

});

app.post('/register/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  var name = req.body.name;
  User.createUser(id, name, function (result) {
    res.send(response(result, "", 300, ""));
  })
});

app.post('/equip/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  var weapon = req.body.weapon;
  let token = req.header('authorization');
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response(false, "", 202, "Invalid Token"))
  } else {
    if (!Boss.isFithing(id)) {
      User.equipWeapon(id, weapon, function (result) {
        res.send(response(result, valid, 200, ""));
      })
    } else {
      res.send(response(result, valid, 300, ""));
      //TODO EQUIPAR ARMA ESTANDO EN PELEA
    }
  }

});

app.post('/refer/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  var code = req.body.code;
  let token = req.header('authorization');
  let valid = Token.validateToken(token.replace("Bearer ", ""), id);
  if (valid == false) {
    res.send(response(false, "", 202, "Invalid Token"))
  } else {
    if (!Boss.isFithing(id)) {
      User.refer(id, code, function (result) {
        res.send(response(result, valid, 200, ""));
      })
    } else {
      res.send(response(false, valid, 300, ""));
      //TODO HACER REFERIDO EN PELEA
    }
  }

});

app.use((req, res) => {
  console.log('Hello Wereld');
  //TODO Intentando llamar a un servicio inexistente
  res.status(404).send({ message: 'Not Found', path: req.originalUrl })
})

app.listen(3000, async function () {
  console.log("El servidor está inicializado en el puerto 3000");
  await MongoDB.connect();
  Boss.start();
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