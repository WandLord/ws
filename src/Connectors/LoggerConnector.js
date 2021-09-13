const { ElasticsearchTransport } = require("winston-elasticsearch");
const winston = require("winston");

module.exports.logTransport = indexPrefix => {

  let consoleTransport = [
    new ElasticsearchTransport({
      ...elasticTransport(indexPrefix)
    })
  ];
  const logger = winston.createLogger({
    transports: consoleTransport
  });
  return logger;
};

const elasticTransport = (indexPrefix) => {

  const esTransportOpts = {
    level: "info",
    index: indexPrefix,
    transformer: logData => {
      console.log(logData);
      logData.timestamp =Math.floor(Date.now() / 1000);
      return {
        user: logData.message.user,
        ip: logData.message.ip,
        id: logData.message.id,
        method: logData.message.method,
        dataIn: logData.message.dataIn,
        dataOut: logData.message.dataOut,
        timestamp: Math.floor(Date.now() / 1000),
        payload: logData.message.payload,
        state: logData.message.state,
      };
    },
    clientOpts: {
      node: process.env.ELASTICSEARCH_HOST,
      auth: {
        username: process.env.ELASTICSEARCH_USER,
        password: process.env.ELASTICSEARCH_PASSWORD,
      },
    }
  };
  return esTransportOpts;
};
