const PARAMS = require('../Constants');
const User = require('./UserManager');
const MongoDB = require('../Connectors/MongoConnector');
const collection_data = "data";

module.exports.spend = async function(userId, price, on, referNickName){
    /*const referUser = User.getUserDataByName(referNickName);
    const refer = ((price/global.PARAMS.CONTENT_PREATOR_PERCETNAGE) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS);
    price -= refer;
    const burn = ((price/global.PARAMS.TOKEN_TO_BURN) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS);
    const boss = ((price/global.PARAMS.TOKEN_TO_BOSS) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS);
    const profit = ((price/global.PARAMS.TOKEN_TO_US) * 100).toFixed(global.PARAMS.TOKEN_DECIMALS);
    */
}