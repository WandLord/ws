const MongoDB = require('../Connectors/MongoConnector');
const Errors = require('../utils/Errors');
const logger = require('../utils/Logger');
const Params = require('../utils/Constants');
const Currensy = require('./CurrencyManager');

let actualBoss = {};
let totaldps = 0;
let updatingData = false;
let lastHP = 0;
let totalPlayers = 0;
let endTimeStamp = null
let totalDPS = 0;

class BossManager {

    isFighting(id) {
        console.log(actualBoss);
        if (actualBoss.fighting.hasOwnProperty(id)) {
            if (actualBoss.fighting[id].fight) {
                return true;
            }
        }
        return false;
    }

    getStatus() {
        if (actualBoss) {
            const auxBoss = actualBoss;
            auxBoss.population = Math.round(10 * auxBoss.players / totalPlayers);
            delete auxBoss.reward;
            delete auxBoss.fighting;
            auxBoss.dps = totaldps;
            return auxBoss;
        }
        logger.SystemCritical({ service: "BossManager.getStatus", data: { actualBoss } });
    }

    async joinPlayer(id, _dps) {
        if (this.isFighting(id)) {
            logger.Hack({ service: "BossManager.joinPlayer", data: { fighting, id }, payload: Errors.INVALID_JOIN_BATTLE() });
            throw Errors.INVALID_JOIN_BATTLE();
        }
        const userField1 = "fighting." + id + ".dps";
        const userField2 = "fighting." + id + ".fight";
        const userField3 = "fighting." + id + ".lastJoin";
        const query = { enable: true };
        const value = { $set: { [userField1]: _dps, [userField2]: true, [userField3]: new Date().toISOString() } };
        const isUpdated = await MongoDB.update(process.env.COLLECTION_BOSS, query, value);
        if (!isUpdated) {
            logger.Hack({ service: "BossManager.joinPlayer", data: { fighting, id }, payload: Errors.INVALID_JOIN_BATTLE() });
            throw Errors.INVALID_JOIN_BATTLE();
        }
        totaldps += _dps;
        if (!actualBoss.fighting.hasOwnProperty(id)) actualBoss.fighting[id] = { totalDPS: 0 };
        actualBoss.fighting[id].dps = _dps;
        actualBoss.fighting[id].lastJoin = new Date().toISOString();
        actualBoss.fighting[id].fight = true;
        actualBoss.players++;
        return true;
    }

    async leftPlayer(id) {
        if (!this.isFighting(id)) {
            logger.Hack({ service: "BossManager.leftPlayer", data: { id }, payload: Errors.INVALID_JOIN_BATTLE() });
            throw Errors.INVALID_LEFT_BATTLE();
        }
        console.log("L67 ", actualBoss.fighting);
        const bossUserData = actualBoss.fighting[id];
        const userField1 = "fighting." + id + ".totalDPS";
        const userField2 = "fighting." + id + ".fight";
        const query = { enable: true };
        console.log("L72 ", endTimeStamp);
        const date = (endTimeStamp) ? endTimeStamp : new Date();
        const _totaldps = ((date.getTime() - new Date(bossUserData.lastJoin).getTime()) / 1000) * bossUserData.dps;
        console.log("L75 ", _totaldps);
        const value = { $inc: { [userField1]: _totaldps }, $set: { [userField2]: false } };
        const isUpdated = await MongoDB.update(process.env.COLLECTION_BOSS, query, value);
        if (!isUpdated) {
            logger.Hack({ service: "BossManager.leftPlayer", data: { fighting, id }, payload: Errors.INVALID_JOIN_BATTLE() });
            throw Errors.INVALID_LEFT_BATTLE();
        }
        console.log("L82 ", actualBoss);
        totaldps -= bossUserData.dps;
        actualBoss.fighting[id].fight = false;
        actualBoss.fighting[id].totalDPS += _totaldps;
        actualBoss.players--;
        return true;
    }

    async _battleEnd() {
        try {
            endTimeStamp = new Date();
            actualBoss.enable = false;
            const bulk = [];
            const auxFighting = Object.keys(actualBoss.fighting);
            for (let key of auxFighting) {
                if (this.isFighting(key)) await this.leftPlayer(key);
                const bossUserData = actualBoss.fighting[key];
                const dpsPercent = (bossUserData.totalDPS * 100) / actualBoss.maxHP;
                const userReward = Math.round(((actualBoss.reward * dpsPercent) / 100) * 100) / 100;
                console.log(key, dpsPercent, userReward, actualBoss.reward, actualBoss.maxHP, bossUserData.totalDPS);
                bulk.push({
                    "updateOne": {
                        "filter": { "_id": MongoDB.createId(key) },
                        "update": { "$inc": { "toClaim.Boss": Number(userReward) } },
                        "upsert": true
                    }
                });
            }
            if (bulk.length > 0) await MongoDB.bulkWrite(process.env.COLLECTION_USER, bulk);
            endTimeStamp = null;
            await this._disableBoss();
            await this._createBoss();
            console.log("shutdown system");
            process.exit(1);
        } catch (err) {
            console.log(err);
            process.exit(1);
        }
    }

    async _loadBoss() {
        const query = { enable: true };
        const newBoss = await MongoDB.findOne(process.env.COLLECTION_BOSS, query, {});
        totalPlayers = (await this._getPlayers()).length;
        actualBoss = newBoss;
        lastHP = actualBoss.actHP;
        await this._loadDPS();
        actualBoss.players = Object.keys(actualBoss.fighting).length;
    }

    async _disableBoss() {
        const query = { enable: true };
        const value = { $set: { enable: false } };
        return MongoDB.update(process.env.COLLECTION_BOSS, query, value);
    }

    async _getPlayers() {
        const date = new Date();
        date.setDate(date.getDate() - process.env.DAYS_MAX_COUNT_USER);
        const query = { lastJoin: { $gte: date.toISOString() } };
        return await MongoDB.find(process.env.COLLECTION_USER, query);
    }

    async _loadDPS() {
        Object.keys(actualBoss.fighting).forEach(function (key) {
            const user = actualBoss.fighting[key];
            totaldps += user.dps;
        });
    }

    async _createBoss() {

        const data = await Currensy.getCurrency();
        const reward = data.boss + Math.round((data.boss / 100) * Params.TOKEN_TO_NEW_BOSS * 100) / 100;
        const currentPlayersDps = await this._getCurrentPlayersDps();
        const newBoss = {
            name: Params.BOSS_NAME_DIC[Math.floor(Math.random() * Params.BOSS_NAME_DIC.length)],
            image: Params.BOSS_ICON_RANGE[Math.floor(Math.random() * Params.BOSS_ICON_RANGE.length)],
            maxHP: 1000000000,
            actHP: 1000000000,
            reward: 100,
            type: Params.ELEMENTS_TYPE[Math.floor(Math.random() * Params.ELEMENTS_TYPE.length)],
            enable: true,
            fighting: {}
        }
        await MongoDB.insert(process.env.COLLECTION_BOSS, newBoss);
        actualBoss = newBoss;
    }

    async _getCurrentPlayersDps() {
        const currentPlayers = await this._getPlayers();
        const currentPlayersDps = currentPlayers.reduce((prev, currentPlayer) => {
            if (currentPlayer.currentWeapon) {
                return prev + currentPlayer.inventory[currentPlayer.currentWeapon].dps;
            } else {
                return prev;
            }
        }, 0);
        return currentPlayersDps;
    }

    async _updateBossData() {
        if (!updatingData && lastHP != actualBoss.actHP) {
            updatingData = true;
            const query = { enable: true };
            const value = { $set: { actHP: actualBoss.actHP } };
            await MongoDB.update(process.env.COLLECTION_BOSS, query, value);
            updatingData = false;
            lastHP = actualBoss.actHP;
        }
    }

    async run() {
        try {
            while (true) {
                await this._sleep(1000);
                actualBoss.actHP -= totaldps;
                await this._updateBossData();
                if (actualBoss.actHP <= 0) {
                    actualBoss.actHP = 0;
                    await this._battleEnd();
                }
            }
        } catch (err) {
            logger.SystemCritical({ service: "BossManager.run", payload: err });
        }
    }

    async start() {
        try {
            await this._loadBoss();
            this.run();
            console.log("Boss - OK");
        } catch (err) {
            logger.SystemCritical({ service: "BossManager.start", payload: err });
        }
    }

    _sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

module.exports = new BossManager();