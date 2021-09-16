const elasticsearch = require("elasticsearch");
const dotenv = require('dotenv');
const httpContext = require('express-http-context');

dotenv.config();

const client = new elasticsearch.Client({
  hosts: [
    `http://${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PASSWORD}@${process.env.ELASTICSEARCH_HOST}`,
  ]
});

module.exports.send = function (index, state, data, stopApp) {
  const body = {
    type: '_doc',
    index: index,
  };
  body.body = data;
  body.body.data = JSON.stringify(data.data, null, '\t');
  if(data.payload){
    body.body.payload = JSON.stringify({code: data.payload.code, message: data.payload.message }, null, '\t');
  } 
  body.body.id = httpContext.get('uuid');
  body.body.timestamp = Date.now();
  body.body.state = state;
  client.index(body,
    function (err, resp, status) {
      if (err) {
        console.log("Error in LoggerConnector: ", err, resp);
        process.exit(1);
      }
      if (stopApp) process.exit(1);
    }
  );

}