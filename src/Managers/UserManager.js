const PARAMS = require('../utils/Constants');
const MongoDB = require('../Connectors/MongoConnector');
const BossManager = require('./BossManager');
const Weapon = require('./WeaponManager');
const Currensy = require('./CurrencyManager');
const Crypto = require('./CryptoManager');
const { ERRORS } = require('../utils/Errors');

const collection_users = "users";
const collection_boss = "boss";

async function validateForge(userId, mainWeaponId, secondaryWeaponId) {

    const userData = await getUserData(userId);
    let price = 0;

    const result = {
        isValid: false,
        price: 0,
        userData
    }

    const hasEnoughBalance = () => {
        const mainWeapon = userData.inventory[mainWeaponId];
        const secondaryWeapon = userData.inventory[secondaryWeaponId];
        mainWeapon.forges = mainWeapon.forges > 4 ? 4 : mainWeapon.forges;
        secondaryWeapon.forges = secondaryWeapon.forges > 4 ? 4 : secondaryWeapon.forges;
        price = global.PARAMS.FORGE_PRICE[mainWeapon.forges] + global.PARAMS.FORGE_PRICE[secondaryWeapon.forges];
        if (price > result.balance) return result;
    }

    if (
        mainWeaponId == secondaryWeaponId ||
        !userData.inventory.hasOwnProperty(mainWeaponId) ||
        !userData.inventory.hasOwnProperty(secondaryWeaponId) ||
        hasEnoughBalance()
    ) {
        return result;
    }

    result.price = price;
    result.isValid = true;
    return result;
}

async function validateExtract(userId, destWeaponId, sourceWeaponId) {
    const userData = await getUserData(userId);
    const response = {
        isValid: false,
        userData,
    }
    if (
        Object.keys(userData.inventory).length <= 2 ||
        userData.currentWeapon == sourceWeaponId ||
        destWeaponId == sourceWeaponId ||
        !userData.inventory.hasOwnProperty(destWeaponId) ||
        !(userData.inventory[destWeaponId].level < global.PARAMS.WEAPON_MAX_LEVEL) ||
        !userData.inventory.hasOwnProperty(sourceWeaponId)
    ) {
        return response;
    }

    response.isValid = true;
    return response;
}

async function validateEquip(userId, weapon) {
    const userData = await getUserData(userId);
    return userData.inventory.hasOwnProperty(weapon) ? true : false;
}

module.exports.forge = async function (userId, mainWeaponId, secondayWeaponId) {

    console.log("Forge"); 

    const result = await validateForge(userId, mainWeaponId, secondayWeaponId);
    if (result.isValid) {
        Currensy.spend(userId, result.price, "forge", result.userData.refer);
        const forgedWeapon = Weapon.forgeWeapon(result.userData.inventory[mainWeaponId], result.userData.inventory[secondayWeaponId]);
        const isNewWeaponForged = await forgeUpdateData(result.userData._id, mainWeaponId, secondayWeaponId, forgedWeapon.weaponId, forgedWeapon.newWeapon, result.price);
        return isNewWeaponForged ? forgedWeapon.newWeapon : false;
    } else {
        throw new Error(ERRORS.INVALID_FORGE.MSG);
    }
}

module.exports.extract = async function (userId, destWeaponId, sourceWeaponId) {
    const result = await validateExtract(userId, destWeaponId, sourceWeaponId);
    if (result.isValid) {
        const dps = Weapon.extract(result.userData.inventory[sourceWeaponId]);
        await extractUpdateData(result.userData._id, destWeaponId, sourceWeaponId, dps);
        result.userData.inventory[destWeaponId].level += 1;
        result.userData.inventory[destWeaponId].dps += dps;
        return result.userData.inventory[destWeaponId];
    } else {
        throw new Error(ERRORS.INVALID_EXTRACT.MSG);
    }
}

module.exports.updateUserData = async function (user) {
    var value = { $set: user };
    var query = { _id: user._id };
    delete user._id;
    return await MongoDB.update(collection_users, query, value);
}

async function forgeUpdateData(userId, _mainWeapon, _secondaryWeapon, _newWeaponId, _newWeapon, _price) {
    _mainWeapon = "inventory." + _mainWeapon + ".forges";
    _secondaryWeapon = "inventory." + _secondaryWeapon + ".forges";
    _newWeaponId = "inventory." + _newWeaponId;
    const value = { $inc: { balance: (_price * -1), [_mainWeapon]: 1, [_secondaryWeapon]: 1 }, $set: { [_newWeaponId]: _newWeapon } };
    const query = { _id: userId };
    return await MongoDB.update(collection_users, query, value);
}

async function extractUpdateData(userId, sourceWeaponId, destroyWeaponId, dps) {
    _sourceWeaponDPS = "inventory." + sourceWeaponId + ".dps";
    _sourceWeaponLevel = "inventory." + sourceWeaponId + ".level";
    _destroyWeapon = "inventory." + destroyWeaponId;
    const query = { _id: userId };
    const value = { $inc: { [_sourceWeaponDPS]: dps, [_sourceWeaponLevel]: 1 }, $unset: { [_destroyWeapon]: "" } };
    return await MongoDB.update(collection_users, query, value);
}

module.exports.equipWeapon = async function (id, weapon) {
    const isEquipValidated = await validateEquip(id, weapon);
    if (isEquipValidated) {
        var query = { _id: MongoDB.createId(id) };
        var value = { $set: { currentWeapon: weapon } };
        return await MongoDB.update(collection_users, query, value);
    }
    return false;
}

module.exports.createUser = async function (userId) {
    const mainWeapon = Weapon.createWeapon();
    const secondaryWeapon = Weapon.createWeapon();
    const internalId = MongoDB.createNewId();
    const newUser = {
        _id: internalId,
        name: Crypto.ofuscateId(internalId.toString()),
        balance: 0,
        blacklist: false,
        register: new Date().toISOString(),
        lastJoin: new Date().toISOString(),
        fighting: false,
        skin: global.PARAMS.PLAYER_DEFAULT_SKIN,
        currentWeapon: mainWeapon[0],
        refer: global.PARAMS.DEFAULT_REFER,
        inventory: {
            [mainWeapon[0]]: mainWeapon[1],
            [secondaryWeapon[0]]: secondaryWeapon[1],
        },
        accounts: {
            google: userId
        }
    };
    await MongoDB.insert(collection_users, newUser);
    return formatUserDataForReturn(newUser);
}

async function getUser(userId) {
    const user = await getUserData(userId);
    if (!user) return false;
    return formatUserDataForReturn(user);
}

module.exports.login = async function (userId) {
    return await getUser(userId);
}

module.exports.refreshData = async function (userId) {
    return await getUser(userId);
}

async function getUserData(userId) {
    const query = { _id: MongoDB.createId(userId) };
    const response = await MongoDB.findOne(collection_users, query,{});
    return response;
}

module.exports.getUserDataByName = async function(userName) {
    const query = { name: new RegExp("^" + userName.toLowerCase(), "i") };
    const response = await MongoDB.findOne(collection_users, query,{});
    return response;
}

module.exports.getUserDataByOauth = async function (userId) {
    const field = "accounts.google"
    const query = { [field]: userId };
    const user = await MongoDB.findOne(collection_users, query);
    if(!user) return false;
    return formatUserDataForReturn(user);
}

async function findUserInBoss(_layer, userId) {
    const query = { layer: _layer };
    const _fighting = "fighting." + userId;
    const _fields = { projection: { [_fighting]: 1, _id: 0 } };
    return await MongoDB.findOneByFields(collection_boss, query, _fields);
}

async function changeFightingStatus(userId, bool) {
    var query = { _id: MongoDB.createId(userId) };
    value = { $set: { fighting: bool } };
    return await MongoDB.update(collection_users, query, value);
}

module.exports.joinBattle = async function (_user) {
    const user = await getUserData(_user);

    // TODO: Capturar arriba
    if (!user) return false;

    var boss = BossManager.getStatus();
    const statusChanged = await changeFightingStatus(_user, true);
    const userField1 = "fighting." + _user + ".dps";
    const userField2 = "fighting." + _user + ".fight";
    const userField3 = "fighting." + _user + ".lastJoin";
    const query = { layer: boss.layer };
    const value = { $set: { [userField1]: user.inventory[user.currentWeapon].dps, [userField2]: true, [userField3]: new Date().toISOString() } };
    if (statusChanged) {
        const isUpdated = await MongoDB.update(collection_boss, query, value);
        if (isUpdated) BossManager.joinPlayer(_user, user.inventory[user.currentWeapon].dps);
        return isUpdated;
    }
    return false;
}

module.exports.leftBattle = async function (_user) {
    var boss = BossManager.getStatus();
    let bossUserData = await findUserInBoss(boss.layer, _user);
    if (!bossUserData) return false;

    bossUserData = bossUserData.fighting[_user];
    if (!bossUserData) return false;
    const statusChanged = await changeFightingStatus(_user, false);
    var userField1 = "fighting." + _user + ".totalDPS";
    var userField2 = "fighting." + _user + ".fight";
    var quey = { layer: boss.layer };
    var _totaldps = ((new Date().getTime() - new Date(bossUserData.lastJoin).getTime()) / 1000) * bossUserData.dps;
    var value = { $inc: { [userField1]: _totaldps }, $set: { [userField2]: false } };
    if (statusChanged) {
        const isUpdated = await MongoDB.update(collection_boss, quey, value);
        if (isUpdated) BossManager.leftPlayer(_user, bossUserData.dps);
        return isUpdated;
    }
    return false;
}

module.exports.UpdateLastJoin = async function (userId, userIp) {
    var quey = { _id: MongoDB.createId(userId) };
    var value = { $set: { lastJoin: new Date().toISOString(), ip: userIp } };
    await MongoDB.update(collection_users, quey, value);
}

module.exports.refer = async function (userId, code) {
    const user = await getUserData(userId);
    const userRefer = await module.exports.getUserDataByName(code);
    if(!user || user.name == code || !userRefer) return false; 
    const quey = { _id: MongoDB.createId(userId) };
    const value = { $set: { refer: code } };
    return await MongoDB.update(collection_users, quey, value);
}

module.exports.addCurrencyToUserId = async function(userId, amount){
    console.log(amount);
    const quey = { _id: MongoDB.createId(userId) };
    const value = { $inc: { balance: amount } };
    return await MongoDB.update(collection_users, quey, value);
}

module.exports.changeNickname = async function (userId, nickname) {
    const user = await getUserData(userId);
    if(!user || user.name != Crypto.ofuscateId(userId) || nickname.length > 20) return false; 
    const quey = { _id: MongoDB.createId(userId) };
    const value = { $set: { name: nickname } };
    return await MongoDB.update(collection_users, quey, value);
}

function formatUserDataForReturn(userData){
    delete userData.register;
    delete userData.lastJoin;
    delete userData.accounts;
    delete userData.blacklist;
    delete userData.ip;
    if(userData.refer.toLowerCase() ==  global.PARAMS.DEFAULT_REFER){
        userData.refer ="";
    }

    return userData;
}