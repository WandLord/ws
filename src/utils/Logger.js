const logger = require("../Connectors/LoggerConnector");
const dotenv = require('dotenv');
dotenv.config();

class Logger {

    SystemInfo(data) {
        logger.send(process.env.ELASTICSEARCH_INDEX_SYSTEM, "OK", data, false);
    }

    SystemError(data) {
        logger.send(process.env.ELASTICSEARCH_INDEX_SYSTEM, "KO", data, false);
    }
    
    SystemCritical(data){
        logger.send(process.env.ELASTICSEARCH_INDEX_SYSTEM, "CRIT", data, true);
    }

    Info(data) {
        logger.send(process.env.ELASTICSEARCH_INDEX_WS, "OK", data, false);
    }

    Error(data) {
        logger.send(process.env.ELASTICSEARCH_INDEX_WS, "KO", data, false);
    }
    
    Hack(data) {
        logger.send(process.env.ELASTICSEARCH_INDEX_WS, "HACK", data, false);
    }

    Critical(data){
        logger.send(process.env.ELASTICSEARCH_INDEX_WS, "CRIT", data, true);
    }
}
module.exports = new Logger();