const elasticsearch = require("elasticsearch");

var client = new elasticsearch.Client({
  hosts: [
    `http://${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PASSWORD}@${process.env.ELASTICSEARCH_HOST}`,
  ]
});

module.exports.loggerSystem = function (data) {
  const body = {};
  body.type = '_doc'
  body.index = "wandlord-system";
  var auxBody = {
    user: data.user,
    ip: data.ip,
    id: data.id,
    method: data.method,
    dataIn: data.dataIn,
    dataOut: data.dataOut,
    timestamp: Math.floor(Date.now() / 1000),
    payload: data.payload,
    state: data.state,
  };
  body.body = auxBody;
  send(body);
}
/*module.exports.loggerSystem = function (_ip, _service, _state, _dataOUT, _dataIN, _user, extra) {
  body = bodyTemplate;
  var auxBody = {};
  auxBody["ip"] = _ip;
  auxBody["service"] = _service;
  auxBody["dataOUT"] = _dataOUT;
  auxBody["state"] = _state;
  auxBody["dataIN"] = _dataIN;
  auxBody["user"] = _user;
  auxBody["extra"] = _extra;
  auxBody["index"] = "System";
  body["body"] = auxBody;
  send(body);
}*/

function send(body) {
  body["body"]["timeStamp"] = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  client.index(body,
    function (err, resp, status) {
      if (err) throw err;
    });
}