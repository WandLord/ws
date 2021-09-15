const Params = require('../utils/Constants');
const User = require('./UserManager');
const MongoDB = require('../Connectors/MongoConnector');
const collection_data = "data";

class CurrencyManager {
    //TODO REFACTOR
    async spend(userId, price, on, referNickName) {
        price = Number(price);
        const referUser = await User.getUserDataByName(referNickName);
        const refer = Number(((price / 100) * Params.REFER_PERCETNAGE).toFixed(Params.TOKEN_DECIMALS));
        price -= refer;
        const burn = Number(((price / 100) * Params.TOKEN_TO_BURN).toFixed(Params.TOKEN_DECIMALS));
        const boss = Number(((price / 100) * Params.TOKEN_TO_BOSS).toFixed(Params.TOKEN_DECIMALS));
        const profit = Number(((price / 100) * Params.TOKEN_TO_US).toFixed(Params.TOKEN_DECIMALS));
        const quey = { name: "currency" };
        const value = { $inc: { burn: burn, boss: boss, profit: profit } };
        await MongoDB.update(collection_data, quey, value);
        await User.addCurrencyToUserId(referUser._id, refer);
    }
}
module.exports = new CurrencyManager();