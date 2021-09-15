const Params = require('../utils/Constants');
const MongoDB = require('../Connectors/MongoConnector');
const BossManager = require('./BossManager');
const Weapon = require('./WeaponManager');
const Currensy = require('./CurrencyManager');
const Crypto = require('./CryptoManager');
const Errors = require('../utils/Errors');

const collection_users = "users";
const collection_boss = "boss";

class UserManager {

    async forge(userId, mainWeaponId, secondayWeaponId) {
        try {
            const result = await this._validateForge(userId, mainWeaponId, secondayWeaponId);
            if (!result.isValid) {
                //TODO LOG HACKER
                logger.SystemError({ method: "UserManager.forge", data: { userId, mainWeaponId, secondayWeaponId, result }, payload: Errors.INVALID_FORGE() });
                throw new Errors.INVALID_FORGE();
            }
            Currensy.spend(userId, result.price, "forge", result.userData.refer);
            const forgedWeapon = Weapon.forgeWeapon(result.userData.inventory[mainWeaponId], result.userData.inventory[secondayWeaponId]);
            const isNewWeaponForged = await this._forgeUpdateData(result.userData._id, mainWeaponId, secondayWeaponId, forgedWeapon.weaponId, forgedWeapon.newWeapon, result.price);
            return isNewWeaponForged ? forgedWeapon.newWeapon : false;
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "UserManager.forge", data: { userId, mainWeaponId, secondayWeaponId, result }, payload: err });
            throw new Errors.INVALID_FORGE();
        }
    }

    async extract(userId, destWeaponId, sourceWeaponId) {
        try {
            const result = await this._validateExtract(userId, destWeaponId, sourceWeaponId);
            if (!result.isValid) {
                //TODO LOG HACKER
                logger.SystemError({ method: "UserManager.extract", data: { userId, destWeaponId, sourceWeaponId, result }, payload: Errors.INVALID_EXTRACT() });
                throw new Errors.INVALID_EXTRACT();
            }
            const dps = Weapon.extract(result.userData.inventory[sourceWeaponId]);
            await this._extractUpdateData(result.userData._id, destWeaponId, sourceWeaponId, dps);
            result.userData.inventory[destWeaponId].level += 1;
            result.userData.inventory[destWeaponId].dps += dps;
            return result.userData.inventory[destWeaponId];

        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "UserManager.extract", data: { userId, destWeaponId, sourceWeaponId, result }, payload: err });
            throw new Errors.INVALID_EXTRACT();
        }
    }

    async updateUserData(user) {
        //TODO Tiene sentido?
        var value = { $set: user };
        var query = { _id: user._id };
        delete user._id;
        return await MongoDB.update(collection_users, query, value);
    }

    async equipWeapon(id, weapon) {
        try {
            const isEquipValidated = await this._validateEquip(id, weapon);
            if (!isEquipValidated) {
                logger.SystemError({ method: "UserManager.equipWeapon", data: { id, weapon }, payload: Errors.INVALID_EQUIP() });
                throw new Errors.INVALID_EQUIP();
            }
            var query = { _id: MongoDB.createId(id) };
            var value = { $set: { currentWeapon: weapon } };
            return await MongoDB.update(collection_users, query, value);
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "UserManager.equipWeapon", data: { id, weapon }, payload: err });
            throw new Errors.INVALID_EQUIP();
        }

    }

    async createUser(userId) {
        try {
            const mainWeapon = Weapon.createWeapon();
            const secondaryWeapon = Weapon.createWeapon();
            const internalId = MongoDB.createNewId();
            const newUser = {
                _id: internalId,
                name: Crypto.encrypt(internalId.toString()),
                balance: 0,
                blacklist: false,
                register: new Date().toISOString(),
                lastJoin: new Date().toISOString(),
                fighting: false,
                skin: Params.PLAYER_DEFAULT_SKIN,
                currentWeapon: mainWeapon[0],
                refer: Params.DEFAULT_REFER,
                inventory: {
                    [mainWeapon[0]]: mainWeapon[1],
                    [secondaryWeapon[0]]: secondaryWeapon[1],
                },
                accounts: {
                    google: userId
                }
            };
            await MongoDB.insert(collection_users, newUser);
            return this._formatUserDataForReturn(newUser);
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "UserManager.createUser", data: { userId }, payload: err });
            throw new Errors.ERROR_REGISTER();
        }
    }

    async login(userId) {
        return await this._getUser(userId);
    }

    async refreshData(userId) {
        return await this._getUser(userId);
    }

    async getUserDataByName(userName) {
        const query = { name: new RegExp("^" + userName.toLowerCase(), "i") };
        const response = await MongoDB.findOne(collection_users, query, {});
        return response;
    }

    async getUserDataByOauth(userId) {
        const field = "accounts.google"
        const query = { [field]: userId };
        const user = await MongoDB.findOne(collection_users, query, {});
        if (!user) return false;
        return this._formatUserDataForReturn(user);
    }

    async joinBattle(_user) {
        const user = await this.getUserData(_user);
        try {
            if (!user) {
                logger.SystemError({ method: "UserManager.joinBattle", data: { _user }, payload: Errors.INVALID_JOIN_BATTLE });
                throw new Errors.INVALID_JOIN_BATTLE();
            }
            const boss = BossManager.getStatus();
            const statusChanged = await this._changeFightingStatus(_user, true);
            const userField1 = "fighting." + _user + ".dps";
            const userField2 = "fighting." + _user + ".fight";
            const userField3 = "fighting." + _user + ".lastJoin";
            const query = { layer: boss.layer };
            const value = { $set: { [userField1]: user.inventory[user.currentWeapon].dps, [userField2]: true, [userField3]: new Date().toISOString() } };
            if (!statusChanged) {
                logger.SystemError({ method: "UserManager.joinBattle", data: { _user, user }, payload: Errors.INVALID_JOIN_BATTLE });
                throw new Errors.INVALID_JOIN_BATTLE();
            }
            const isUpdated = await MongoDB.update(collection_boss, query, value);
            if (isUpdated) BossManager.joinPlayer(_user, user.inventory[user.currentWeapon].dps);
            return isUpdated;
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "UserManager.joinBattle", data: { _user }, payload: err });
            throw new Errors.INVALID_JOIN_BATTLE();
        }

    }

    async leftBattle(_user) {
        try {
            const boss = BossManager.getStatus();
            let bossUserData = await this._findUserInBoss(boss.layer, _user);
            if (!bossUserData){
                logger.SystemError({ method: "UserManager.leftBattle", data: { _user }, payload: Errors.INVALID_LEFT_BATTLE });
                throw new Errors.INVALID_LEFT_BATTLE();
            }
            bossUserData = bossUserData.fighting[_user];
            const statusChanged = await this._changeFightingStatus(_user, false);
            const userField1 = "fighting." + _user + ".totalDPS";
            const userField2 = "fighting." + _user + ".fight";
            const quey = { layer: boss.layer };
            const _totaldps = ((new Date().getTime() - new Date(bossUserData.lastJoin).getTime()) / 1000) * bossUserData.dps;
            const value = { $inc: { [userField1]: _totaldps }, $set: { [userField2]: false } };
            if (!statusChanged) {
                logger.SystemError({ method: "UserManager.leftBattle", data: { _user, bossUserData }, payload: Errors.INVALID_LEFT_BATTLE });
                throw new Errors.INVALID_LEFT_BATTLE();
            }
            const isUpdated = await MongoDB.update(collection_boss, quey, value);
            if (isUpdated) BossManager.leftPlayer(_user, bossUserData.dps);
            return isUpdated;
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "UserManager.leftBattle", data: { _user }, payload: err });
            throw new Errors.INVALID_JOIN_BATTLE();
        }

    }

    async UpdateLastJoin(userId, userIp) {
        const quey = { _id: MongoDB.createId(userId) };
        const value = { $set: { lastJoin: new Date().toISOString(), ip: userIp } };
        await MongoDB.update(collection_users, quey, value);
    }

    async refer(userId, code) {
        const user = await getUserData(userId);
        const userRefer = await this.getUserDataByName(code);
        if (!user || user.name == code || !userRefer){
            logger.SystemError({ method: "UserManager.refer", data: { userId, code }, payload: Errors.INVALID_REFER });
            throw new Errors.INVALID_REFER(); 
        }
        const query = { _id: MongoDB.createId(userId) };
        const value = { $set: { refer: code } };
        return await MongoDB.update(collection_users, query, value);
    }

    async addCurrencyToUserId(userId, amount) {
        const quey = { _id: MongoDB.createId(userId) };
        const value = { $inc: { balance: amount } };
        return await MongoDB.update(collection_users, quey, value);
    }

    async getUserData(userId) {
        const query = { _id: MongoDB.createId(userId) };
        return await MongoDB.findOne(collection_users, query, {});
    }

    async changeNickname(userId, nickname) {
        const user = await this.getUserData(userId);
        if (!user || user.name != Crypto.ofuscateId(userId) || nickname.length > 20) return false;
        const quey = { _id: MongoDB.createId(userId) };
        const value = { $set: { name: nickname } };
        return await MongoDB.update(collection_users, quey, value);
    }

    async getUser(userId) {
        const user = await this.getUserData(userId);
        if (!user) return false;
        return this._formatUserDataForReturn(user);
    }

    async _validateForge(userId, mainWeaponId, secondaryWeaponId) {
        const userData = await this.getUserData(userId);
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
            price = Params.FORGE_PRICE[mainWeapon.forges] + Params.FORGE_PRICE[secondaryWeapon.forges];
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

    async _validateExtract(userId, destWeaponId, sourceWeaponId) {
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
            !(userData.inventory[destWeaponId].level < Params.WEAPON_MAX_LEVEL) ||
            !userData.inventory.hasOwnProperty(sourceWeaponId)
        ) {
            return response;
        }

        response.isValid = true;
        return response;
    }

    async _validateEquip(userId, weapon) {
        const userData = await this.getUserData(userId);
        return userData.inventory.hasOwnProperty(weapon) ? true : false;
    }

    async _forgeUpdateData(userId, _mainWeapon, _secondaryWeapon, _newWeaponId, _newWeapon, _price) {
        _mainWeapon = "inventory." + _mainWeapon + ".forges";
        _secondaryWeapon = "inventory." + _secondaryWeapon + ".forges";
        _newWeaponId = "inventory." + _newWeaponId;
        const value = { $inc: { balance: (_price * -1), [_mainWeapon]: 1, [_secondaryWeapon]: 1 }, $set: { [_newWeaponId]: _newWeapon } };
        const query = { _id: userId };
        return await MongoDB.update(collection_users, query, value);
    }

    async _extractUpdateData(userId, sourceWeaponId, destroyWeaponId, dps) {
        _sourceWeaponDPS = "inventory." + sourceWeaponId + ".dps";
        _sourceWeaponLevel = "inventory." + sourceWeaponId + ".level";
        _destroyWeapon = "inventory." + destroyWeaponId;
        const query = { _id: userId };
        const value = { $inc: { [_sourceWeaponDPS]: dps, [_sourceWeaponLevel]: 1 }, $unset: { [_destroyWeapon]: "" } };
        return await MongoDB.update(collection_users, query, value);
    }

    _formatUserDataForReturn(userData) {
        delete userData.register;
        delete userData.lastJoin;
        delete userData.accounts;
        delete userData.blacklist;
        delete userData.ip;
        if (userData.refer.toLowerCase() == Params.DEFAULT_REFER) {
            userData.refer = "";
        }

        return userData;
    }

    async _findUserInBoss(_layer, userId) {
        const query = { layer: _layer };
        const _fighting = "fighting." + userId;
        const _fields = { projection: { [_fighting]: 1, _id: 0 } };
        return await MongoDB.findOne(collection_boss, query, _fields);
    }

    async _changeFightingStatus(userId, bool) {
        var query = { _id: MongoDB.createId(userId) };
        value = { $set: { fighting: bool } };
        return await MongoDB.update(collection_users, query, value);
    }

}
module.exports = new UserManager();