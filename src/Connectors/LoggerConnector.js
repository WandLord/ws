const elasticsearch = require("elasticsearch");
const dotenv = require('dotenv');
dotenv.config();

var client = new elasticsearch.Client({
  hosts: [
    `http://${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PASSWORD}@${process.env.ELASTICSEARCH_HOST}`,
  ]
});

module.exports.logger = function (index, data) {
  const body = {};
  body.type = '_doc'
  body.index = index;
  body.body = {
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
  send(body);
}

function send(body) {
  client.index(body,
    function (err, resp, status) {
      if (err) throw err;
    });
}