const MongoDB = require('../Connectors/MongoConnector');
const Errors = require('../utils/Errors');

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
        logger.SystemError({ method: "BossManager.getStatus", data: {actualBoss}, payload: err });
        process.exit(1);
    }

    joinPlayer(id, _dps) {
        if(!fighting.includes(id)){
            logger.SystemError({ method: "BossManager.getStatus", data: {fighting, id}, payload: err });
            //TODO LOG POSIBLE HACKER
           throw new Errors.INVALID_JOIN_BATTLE();
        }
        totaldps += _dps;
        fighting.push(id);
        actualBoss.players++;
    }

    leftPlayer(id, _dps) {
        if (fighting.includes(id)) {
            logger.SystemError({ method: "BossManager.getStatus", data: {fighting, id}, payload: err });
            //TODO LOG POSIBLE HACKER
            throw new Errors.INVALID_LEFT_BATTLE();
        }
        const index = fighting.indexOf(id);
        totaldps -= _dps;
        fighting.splice(index, 1);
        actualBoss.players--;
    }

    async _battleEnd() {
        actualBoss.enable = false;
        totaldps = 0;
        var query = { layer: actualBoss.layer };
        var order = {};
        MongoDB.findOne(collection_boss, query, order, function (result) {
            auxBoss = result;
        });
        await this._loadBoss();
    }

    async _loadBoss() {
        var query = { enable: true };
        var order = { projection: { fighting: 0 } };
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
        var query = { _id: id };
        var order = {};
        const boss = await MongoDB.findOne(collection_boss, query, order);
        Object.keys(boss.fighting).forEach(function (key) {
            var user = boss.fighting[key];
            if (user.fight) {
                fighting.push(key);
                totaldps += user.dps;
            }
        });
    }

    async _updateBossData() {
        if (!updatingData) {
            updatingData = true;
            var query = { enable: true };
            var value = { $set: { actHP: actualBoss.actHP } };
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
            logger.SystemError({ method: "BossManager.run", payload: err });
            process.exit(1);
        }
    }

    async start() {
        try {
            await this._loadBoss();
            this.run();
            console.log("Boss - OK");
        } catch (err) {
            logger.SystemError({ method: "BossManager.start", payload: err });
            process.exit(1);
        }
    }

    _sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
}

module.exports = new BossManager();