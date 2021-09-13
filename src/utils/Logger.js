const elastic = require("../Connectors/LoggerConnector");

const systemIndex = "wandlord-system";
const wsIndex = "wandlord-ws";
const transactionsIndex = "wandlord-transactions";

class Logger {

    SystemInfo(data) {
        elastic.logger(systemIndex, data);
    }
/*
    SystemWarning(data) {
        const logger = logTransport(systemIndex);
        logger.warning(data);
    }

    SystemError(data) {
        const logger = logTransport(systemIndex);
        logger.error(data);
    }

    Info(data) {
        const logger = logTransport(wsIndex);
        logger.info(data);
    }

    Warning(data) {
        const logger = logTransport(wsIndex);
        logger.warning(data);
    }

    Error(data) {
        const logger = logTransport(wsIndex);
        logger.error(data);
    }*/
}
module.exports = new Logger();