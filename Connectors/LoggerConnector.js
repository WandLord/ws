const elasticsearch  =require('elasticsearch');
var bodyTemplate = {index: "connections", type: '_doc',};

var client = new elasticsearch.Client( {  
  hosts: [
    'http://elastic:changeme@localhost:9200',
  ]
});

module.exports.loggerService = function(_ip, _service, _state, _dataOUT, _dataIN, _user, _extra){
  body = bodyTemplate;
  body["index"] = "connections";
  var auxBody = {};
  auxBody["ip"] = _ip.replace("::ffff:","");
  auxBody["service"] = _service;
  auxBody["dataOUT"] = _dataOUT;
  auxBody["state"] = _state;
  auxBody["dataIN"] = _dataIN;
  auxBody["user"] = _user;
  auxBody["extra"] = _extra;
  body["body"] = auxBody;
  send(body);
}
module.exports.loggerSystem = function(_ip, _service, _state, _dataOUT, _dataIN, _user, extra){
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
}

function send(body) {
  body["body"]["timeStamp"] = new Date().toISOString().replace(/T/, ' ').replace(/\..+/, '');
  client.index(body,
     function(err, resp, status) {
    if(err) throw err;
});
}