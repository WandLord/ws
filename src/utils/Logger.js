const logger = require("../Connectors/LoggerConnector");

const systemIndex = "wandlord-system";
const wsIndex = "wandlord-ws";
const transactionsIndex = "wandlord-transactions";

class Logger {

    SystemInfo(data) {
        logger.send(systemIndex, "OK", data);
    }

    SystemError(data) {
        logger.send(systemIndex, "KO", data);
    }

    Info(data) {
        logger.send(wsIndex, "OK", data);
    }

    Error(data) {
        logger.send(wsIndex, "KO", data);
    }
}
module.exports = new Logger();