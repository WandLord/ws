const express = require("express");
const logger = require('./Connectors/ConnectorELK');
const Boss = require('./Managers/ManagerBoss');
const User = require('./Managers/ManagerUsers');
const PARAMS = require('./Constants');
const MongoDB = require('./Connectors/ConnectorMongoDB');

const OK = "OK";
const KO = "KO";
const app = express();
app.use(express.json());

app.get('/statusboss', function (req, res) {
  var response = Boss.Status();
  res.send(response);
});

app.get('/login/:id', function (req, res) {
  let id = req.params.id;
  User.getUserData(id, function(response){
    res.send(response);
  });
});

app.get('/joinbattle/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  User.joinBattle(id, function(result) {
    res.send(result);
  });
});

app.get('/leftBattle/:id', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  let id = req.params.id;
  User.leftBattle(id, function(result) {
    res.send(result);
  });
});

app.post('/forge', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  var user = req.body.id;
  var weapon1 = req.body.weapon1;
  var weapon2 = req.body.weapon2;
  User.forge(user, weapon1, weapon2, function(result) {
    res.send(result);
  })
});

app.post('/register', function (req, res) {
  var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  var token_id = req.body.token_id;
  var name = req.body.name;
  User.createUser(token_id, name, function(result) {
    res.send(result);
  })
});

app.use((req, res) => {
  console.log('Hello Wereld');
  //TODO Intentando llamar a un servicio inexistente
  res.status(404).send({ message: 'Not Found', path: req.originalUrl })
})

app.listen(3000, async function(){
  console.log("El servidor está inicializado en el puerto 3000");
  await MongoDB.connect();
  Boss.start();
});