const Params = require('../utils/Constants');
const MongoDB = require('../Connectors/MongoConnector');
const Logger = require('../utils/Logger');

class CurrencyManager {
    async spend(userId, price, on, referId) {
        try {
            price = Number(price);
            const refer = Number(((price / 100) * Params.REFER_PERCETNAGE).toFixed(Params.TOKEN_DECIMALS));
            price -= refer;
            const burn = Number(((price / 100) * Params.TOKEN_TO_BURN).toFixed(Params.TOKEN_DECIMALS));
            const boss = Number(((price / 100) * Params.TOKEN_TO_BOSS).toFixed(Params.TOKEN_DECIMALS));
            const profit = Number(((price / 100) * Params.TOKEN_TO_US).toFixed(Params.TOKEN_DECIMALS));
            const query = { name: "currency" };
            const value = { $inc: { burn: burn, boss: boss, profit: profit } };
            const updateCurrencyData = await MongoDB.update(process.env.COLLECTION_DATA, query, value);
            Logger.SystemInfo({ service: "CurrencyManager.spend", data: { referId, price, userId, on, refer, burn, boss, profit } });
            return Number(refer);
        } catch (err) {
            console.log(err);
            Logger.SystemError({ service: "CurrencyManager.spend", data: { referId, price, userId, on } });
        }
    }

    async getCurrency(){
        const query = { name: "currency" };
        return await MongoDB.findOneDefinite(process.env.COLLECTION_DATA, query, {});

    }
}
module.exports = new CurrencyManager();