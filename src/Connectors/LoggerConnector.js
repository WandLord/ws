const elasticsearch = require("elasticsearch");
const dotenv = require('dotenv');
dotenv.config();

const client = new elasticsearch.Client({
  hosts: [
    `http://${process.env.ELASTICSEARCH_USER}:${process.env.ELASTICSEARCH_PASSWORD}@${process.env.ELASTICSEARCH_HOST}`,
  ]
});

module.exports.send = function (index, state, data) {
  const body = {
    type: '_doc',
    index: index,
  };
  body.body = data;
  body.body.timestamp = Math.floor(Date.now() / 1000);
  body.body.state = state;

  client.index(body,
    function (err, resp, status) {
      if (err) {
        console.log("Error in LoggerConnector: ", err, resp, status);
        process.exit(1);
      }
    }
  );
}