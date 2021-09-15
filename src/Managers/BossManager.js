const MongoDB = require('../Connectors/MongoConnector');
const Errors = require('../utils/Errors');
const logger = require('../utils/Logger');

const collection_boss = "boss";
let actualBoss = {};
let totaldps = 0;
let updatingData = false;
let fighting = [];

class BossManager {

    isFighting(id) {
        return fighting.includes(id);
    }

    getStatus() {
        if(actualBoss){
            const auxBoss = actualBoss;
            delete auxBoss.reward;
            delete auxBoss.fighting;
            return auxBoss;
        }
        logger.SystemCritical({ service: "BossManager.getStatus", data: {actualBoss}, payload: err });
    }

    joinPlayer(id, _dps) {
        if(!fighting.includes(id)){
            logger.SystemError({ service: "BossManager.getStatus", data: {fighting, id}, payload: err });
            //TODO LOG POSIBLE HACKER
           throw Errors.INVALID_JOIN_BATTLE();
        }
        totaldps += _dps;
        fighting.push(id);
        actualBoss.players++;
    }

    leftPlayer(id, _dps) {
        if (fighting.includes(id)) {
            logger.SystemError({ service: "BossManager.getStatus", data: {fighting, id}, payload: err });
            //TODO LOG POSIBLE HACKER
            throw Errors.INVALID_LEFT_BATTLE();
        }
        const index = fighting.indexOf(id);
        totaldps -= _dps;
        fighting.splice(index, 1);
        actualBoss.players--;
    }

    async _battleEnd() {
        actualBoss.enable = false;
        totaldps = 0;
        const query = { layer: actualBoss.layer };
        const order = {};
        MongoDB.findOne(collection_boss, query, order, function (result) {
            auxBoss = result;
        });
        await this._loadBoss();
    }

    async _loadBoss() {
        const query = { enable: true };
        const order = { projection: { fighting: 0 } };
        const newBoss = await MongoDB.findOne(collection_boss, query, order);

        if (newBoss.actHP <= 0) {
            await this._battleEnd();
        } else if (newBoss.enable == true) {
            actualBoss = newBoss;
            await this._loadDPS(actualBoss._id);
            actualBoss.players = fighting.length;
        }
        return true;
    }

    async _loadDPS(id) {
        const query = { _id: id };
        const order = {};
        const boss = await MongoDB.findOne(collection_boss, query, order);
        Object.keys(boss.fighting).forEach(function (key) {
            const user = boss.fighting[key];
            if (user.fight) {
                fighting.push(key);
                totaldps += user.dps;
            }
        });
    }

    async _updateBossData() {
        if (!updatingData) {
            updatingData = true;
            const query = { enable: true };
            const value = { $set: { actHP: actualBoss.actHP } };
            await MongoDB.update(collection_boss, query, value);
            updatingData = false;
        }
    }

    async run() {
        try {
            while (true) {
                await this._sleep(1000);
                actualBoss.actHP -= totaldps;
                this._updateBossData();
                if (actualBoss.actHP <= 0) {
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
            logger.SystemError({ service: "BossManager.start", payload: err });
        }
    }

    _sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

module.exports = new BossManager();