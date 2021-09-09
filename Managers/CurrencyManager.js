const PARAMS = require('../Constants');
const User = require('./UserManager');
const MongoDB = require('../Connectors/MongoConnector');
const collection_data = "data";

module.exports.spend = async function (userId, price, on, referNickName) {
    price = Number(price);
    const referUser = await User.getUserDataByName(referNickName);
    const refer = Number(((price / 100) * global.PARAMS.REFER_PERCETNAGE).toFixed(global.PARAMS.TOKEN_DECIMALS));
    price -= refer;
    const burn = Number(((price / global.PARAMS.TOKEN_TO_BURN) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS));
    const boss = Number(((price / global.PARAMS.TOKEN_TO_BOSS) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS));
    const profit = Number(((price / global.PARAMS.TOKEN_TO_US) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS));
    const quey = { name: "currency" };
    const value = { $set: { burn: burn,  boss: boss, profit: profit } };
    console.log(value);
    await MongoDB.update(collection_data, quey, value);
    await User.addCurrencyToUserId(referUser._id, refer);
}