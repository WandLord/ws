const PARAMS = require('../utils/Constants');
const User = require('./UserManager');
const MongoDB = require('../Connectors/MongoConnector');
const collection_data = "data";

module.exports.spend = async function (userId, price, on, referNickName) {
    console.log("Spending");
    price = Number(price);
    const referUser = await User.getUserDataByName(referNickName);
    const refer = Number(((price / 100) * global.PARAMS.REFER_PERCETNAGE).toFixed(global.PARAMS.TOKEN_DECIMALS));
    price -= refer;
    const burn = Number(((price / 100) * global.PARAMS.TOKEN_TO_BURN).toFixed(global.PARAMS.TOKEN_DECIMALS));
    const boss = Number(((price / 100) * global.PARAMS.TOKEN_TO_BOSS).toFixed(global.PARAMS.TOKEN_DECIMALS));
    const profit = Number(((price / 100) * global.PARAMS.TOKEN_TO_US).toFixed(global.PARAMS.TOKEN_DECIMALS));
    const quey = { name: "currency" };
    const value = { $inc: { burn: burn,  boss: boss, profit: profit } };
    await MongoDB.update(collection_data, quey, value);
    await User.addCurrencyToUserId(referUser._id, refer);
}
