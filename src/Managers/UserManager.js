const Params = require('../utils/Constants');
const MongoDB = require('../Connectors/MongoConnector');
const BossManager = require('./BossManager');
const Weapon = require('./WeaponManager');
const Currensy = require('./CurrencyManager');
const Crypto = require('./CryptoManager');
const Errors = require('../utils/Errors');
const logger = require('../utils/Logger');


class UserManager {

    async forge(userId, mainWeaponId, secondayWeaponId) {
        try {
            const result = await this._validateForge(userId, mainWeaponId, secondayWeaponId);
            if (!result.isValid) {
                logger.Hack({ service: "UserManager.forge", data: { userId, mainWeaponId, secondayWeaponId, result }, payload: Errors.INVALID_FORGE() });
                throw Errors.INVALID_FORGE();
            }
            await this.spend(userId, result.price, "forge", result.userData.refer);
            const forgedWeapon = Weapon.forgeWeapon(result.userData.inventory[mainWeaponId], result.userData.inventory[secondayWeaponId]);
            const isNewWeaponForged = await this._forgeUpdateData(result.userData._id, mainWeaponId, secondayWeaponId, forgedWeapon.weaponId, forgedWeapon.newWeapon, result.price);
            return isNewWeaponForged ? forgedWeapon.newWeapon : false;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.forge", data: { userId, mainWeaponId, secondayWeaponId, result }, payload: err });
            throw Errors.INVALID_FORGE();
        }
    }

    async extract(userId, destWeaponId, sourceWeaponId) {
        try {
            const result = await this._validateExtract(userId, destWeaponId, sourceWeaponId);
            if (!result.isValid) {
                logger.Hack({ service: "UserManager.extract", data: { userId, destWeaponId, sourceWeaponId, result }, payload: Errors.INVALID_EXTRACT() });
                throw Errors.INVALID_EXTRACT();
            }
            const dps = Weapon.extract(result.userData.inventory[sourceWeaponId]);
            await this._extractUpdateData(result.userData._id, destWeaponId, sourceWeaponId, dps);
            result.userData.inventory[destWeaponId].level += 1;
            result.userData.inventory[destWeaponId].dps += dps;
            return result.userData.inventory[destWeaponId];

        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.extract", data: { userId, destWeaponId, sourceWeaponId }, payload: err });
            throw Errors.INVALID_EXTRACT();
        }
    }
    async spend(userId, price, on, referNickName) {
        const referId = (await this.getUserDataByName(referNickName))._id.toString();
        const data = await Currensy.spend(userId, price, on, referId);
        this.addToClaim(referId, data, "Refers");
    }
    async updateUserData(user) {
        //TODO Tiene sentido?
        const value = { $set: user };
        const query = { _id: user._id };
        delete user._id;
        return await MongoDB.update(process.env.COLLECTION_USER, query, value);
    }

    async equipWeapon(id, weapon) {
        try {
            const isEquipValidated = await this._validateEquip(id, weapon);
            if (!isEquipValidated) {
                logger.Hack({ service: "UserManager.equipWeapon", data: { id, weapon }, payload: Errors.INVALID_EQUIP() });
                throw Errors.INVALID_EQUIP();
            }
            const query = { _id: MongoDB.createId(id) };
            const value = { $set: { currentWeapon: weapon } };
            return await MongoDB.update(process.env.COLLECTION_USER, query, value);
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.equipWeapon", data: { id, weapon }, payload: err });
            throw Errors.INVALID_EQUIP();
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
                balance: 10000,
                blacklist: false,
                register: new Date().toISOString(),
                lastJoin: new Date().toISOString(),
                fighting: false,
                currentWeapon: mainWeapon[0],
                refer: Params.DEFAULT_REFER,
                inventory: {
                    [mainWeapon[0]]: mainWeapon[1],
                    [secondaryWeapon[0]]: secondaryWeapon[1],
                },
                accounts: {
                    google: userId
                },
                toClaim:
                {
                    Refers: 0,
                    Boss: 0,
                }
            };
            await MongoDB.insert(process.env.COLLECTION_USER, newUser);
            return this._formatUserDataForReturn(newUser);
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.createUser", data: { userId }, payload: err });
            throw Errors.ERROR_REGISTER();
        }
    }

    async login(userId) {
        return await this.getUser(userId);
    }

    async refreshData(userId) {
        return await this.getUser(userId);
    }

    async getUserDataByName(userName) {
        const query = { name: new RegExp("^" + userName.toLowerCase(), "i") };
        return await MongoDB.findOneDefinite(process.env.COLLECTION_USER, query, {});
    }

    async getUserDataByOauth(userId) {
        const field = "accounts.google"
        const query = { [field]: userId };
        const user = await MongoDB.findOne(process.env.COLLECTION_USER, query, {});
        if (!user) return false;
        return this._formatUserDataForReturn(user);
    }

    async joinBattle(_user) {
        try {
            const user = await this.getUserData(_user);
            if (!user) {
                logger.SystemError({ service: "UserManager.joinBattle", data: { _user }, payload: Errors.INVALID_JOIN_BATTLE() });
                throw Errors.INVALID_JOIN_BATTLE();
            }
            const isUpdated = await BossManager.joinPlayer(_user, user.inventory[user.currentWeapon].dps);
            if (!isUpdated) {
                logger.SystemError({ service: "UserManager.joinBattle", data: { _user, user }, payload: Errors.INVALID_JOIN_BATTLE() });
                throw Errors.INVALID_JOIN_BATTLE();
            }
            return isUpdated;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.joinBattle", data: { _user }, payload: err });
            throw Errors.INVALID_JOIN_BATTLE();
        }

    }

    async leftBattle(_user) {
        try {
            const isFighting = BossManager.isFighting(_user);
            if (!isFighting) {
                logger.SystemError({ service: "UserManager.leftBattle", data: { _user }, payload: Errors.INVALID_LEFT_BATTLE() });
                throw Errors.INVALID_LEFT_BATTLE();
            }
            const isUpdated = await BossManager.leftPlayer(_user);
            if (!isUpdated) {
                logger.SystemError({ service: "UserManager.leftBattle", data: { _user }, payload: Errors.INVALID_LEFT_BATTLE() });
                throw Errors.INVALID_LEFT_BATTLE();
            }
            return isUpdated;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.leftBattle", data: { _user }, payload: err });
            throw Errors.INVALID_JOIN_BATTLE();
        }

    }

    async UpdateLastJoin(userId, userIp) {
        const quey = { _id: MongoDB.createId(userId) };
        const value = { $set: { lastJoin: new Date().toISOString(), ip: userIp } };
        await MongoDB.update(process.env.COLLECTION_USER, quey, value);
    }

    async refer(userId, code) {
        const user = await getUserData(userId);
        const userRefer = await this.getUserDataByName(code);
        if (!user || user.name == code || !userRefer) {
            logger.SystemError({ service: "UserManager.refer", data: { userId, code }, payload: Errors.INVALID_REFER() });
            throw Errors.INVALID_REFER();
        }
        const query = { _id: MongoDB.createId(userId) };
        const value = { $set: { refer: code } };
        return await MongoDB.update(process.env.COLLECTION_USER, query, value);
    }

    async getUserData(userId) {
        const query = { _id: MongoDB.createId(userId) };
        return await MongoDB.findOne(process.env.COLLECTION_USER, query, {});
    }

    async changeNickname(userId, nickname) {
        try {
            const user = await this.getUserData(userId);
            if (!user) {
                logger.SystemError({ service: "UserManager.changeNickname", data: { userId, nickname }, payload: Errors.INVALID_NICKNAME() });
                throw Errors.INVALID_NICKNAME();
            }
            if (user.name.length <= 20 || nickname.length > 20) {
                logger.Hack({ service: "UserManager.changeNickname", data: { userId, nickname }, payload: Errors.ERROR_NICKNAME() });
                throw Errors.ERROR_NICKNAME();
            }
            const quey = { _id: MongoDB.createId(userId) };
            const value = { $set: { name: nickname } };
            return await MongoDB.update(process.env.COLLECTION_USER, quey, value);
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "UserManager.changeNickname", data: { _user }, payload: err });
            throw Errors.INVALID_JOIN_BATTLE();
        }
    }

    async addToClaim(userId, cant, reason) {
        const field = "toClaim." + reason;
        const quey = { _id: MongoDB.createId(userId) };
        const value = { $inc: { [field]: cant } };
        return await MongoDB.update(process.env.COLLECTION_USER, quey, value);
    }

    async claim(userId) {
        const user = await this.getUser(userId);
        if (!user) {
            logger.Hack({ service: "UserManager.claim", data: { userId }, payload: Errors.ERROR_CLAIM() });
            throw Errors.ERROR_CLAIM();
        }
        const field1 = "toClaim.Refers";
        const field2 = "toClaim.Boss";
        const quey = { _id: MongoDB.createId(userId) };
        const value = [{ $set: { balance: { $add: ["$toClaim.Refers", "$toClaim.Boss", "$balance"] }, [field1]: 0, [field2]: 0 }}];
        return await MongoDB.update(process.env.COLLECTION_USER, quey, value);
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
            const W1price = mainWeapon.dps * Params.FORGE_PRICE[mainWeapon.rarity] / 100 + mainWeapon.forges * Params.FORGE_INC_PRICE_FORGES;
            const W2price = secondaryWeapon.dps * Params.FORGE_PRICE[secondaryWeapon.rarity] / 100 + secondaryWeapon.forges * Params.FORGE_INC_PRICE_FORGES;
            price = Math.round((W1price + W2price) * 100) / 100;
            console.log(price, userData.balance, price > userData.balance)
            if (price > userData.balance) return result;
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
        const userData = await this.getUserData(userId);
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
        if (userData.currentWeapon == weapon) return false;
        return userData.inventory.hasOwnProperty(weapon) ? true : false;
    }

    async _forgeUpdateData(userId, _mainWeapon, _secondaryWeapon, _newWeaponId, _newWeapon, _price) {
        _mainWeapon = "inventory." + _mainWeapon + ".forges";
        _secondaryWeapon = "inventory." + _secondaryWeapon + ".forges";
        _newWeaponId = "inventory." + _newWeaponId;
        const value = { $inc: { balance: (_price * -1), [_mainWeapon]: 1, [_secondaryWeapon]: 1 }, $set: { [_newWeaponId]: _newWeapon } };
        const query = { _id: userId };
        return await MongoDB.update(process.env.COLLECTION_USER, query, value);
    }

    async _extractUpdateData(userId, sourceWeaponId, destroyWeaponId, dps) {
        const _sourceWeaponDPS = "inventory." + sourceWeaponId + ".dps";
        const _sourceWeaponLevel = "inventory." + sourceWeaponId + ".level";
        const _destroyWeapon = "inventory." + destroyWeaponId;
        const query = { _id: userId };
        const value = { $inc: { [_sourceWeaponDPS]: dps, [_sourceWeaponLevel]: 1 }, $unset: { [_destroyWeapon]: "" } };
        return await MongoDB.update(process.env.COLLECTION_USER, query, value);
    }

    _formatUserDataForReturn(userData) {
        userData.fighting = BossManager.isFighting(userData._id.toString());
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
}
module.exports = new UserManager();