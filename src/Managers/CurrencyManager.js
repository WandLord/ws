const Params = require('../utils/Constants');
const MongoDB = require('../Connectors/MongoConnector');
const Logger = require('../utils/Logger');
const safed = require('safe-decimals');

class CurrencyManager {
    async spend(userId, price, on, referId) {
        try {
            price = price;
            const refer = ((price / 100) * Params.REFER_PERCETNAGE).safe();
            price -= refer;
            const burn = ((price / 100) * Params.TOKEN_TO_BURN).safe();
            const boss = ((price / 100) * Params.TOKEN_TO_BOSS).safe();
            const profit = ((price / 100) * Params.TOKEN_TO_US).safe();
            const query = { name: "currency" };
            const value = { $inc: { burn: burn, boss: boss, profit: profit } };
            const updateCurrencyData = await MongoDB.update(process.env.COLLECTION_DATA, query, value);
            Logger.SystemInfo({ service: "CurrencyManager.spend", data: { referId, price, userId, on, refer, burn, boss, profit } });
            return refer;
        } catch (err) {
            console.log(err);
            Logger.SystemError({ service: "CurrencyManager.spend", data: { referId, price, userId, on } });
        }
    }

    async getCurrency() {
        const query = { name: "currency" };
        return await MongoDB.findOneDefinite(process.env.COLLECTION_DATA, query, {});

    }
}
module.exports = new CurrencyManager();