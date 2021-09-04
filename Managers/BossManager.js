const express = require("express");
const BossManager = express();
const MongoDB = require('../Connectors/MongoConnector');
const collection_boss = "boss";

var actualBoss = {};
var totaldps = 0;
var updatingData = false;
var fighting = [];

module.exports.Status = function () {
    var auxBoss = actualBoss;
    delete auxBoss.reward;
    delete auxBoss.fighting;
    return auxBoss;
}

async function battleEnd() {
    actualBoss.enable = false;
    totaldps = 0;
    var query = { layer: actualBoss.layer };
    var order = {};
    var auxBoss;
    MongoDB.findOne(collection_boss, query, order, function (result) {
        auxBoss = result;
    });
    await loadBoss();
}

module.exports.joinPlayer = function (id, _dps) {
    totaldps += _dps;
    fighting.push(id);
}
module.exports.leftPlayer = function (id, _dps) {
    totaldps -= _dps;
    var index = fighting.indexOf(id);
    if (index > -1) {
        fighting.splice(index, 1);
    }
}

async function loadBoss() {
    var query = { enable: true };
    var order = { projection: { fighting: 0 } };
    const newBoss = await MongoDB.findOne(collection_boss, query, order);
    
    if (!newBoss) return false;

    if (newBoss.actHP <= 0) {
        await battleEnd();
    } else if (newBoss.enable == true) {
        actualBoss = newBoss;
        await loadDPS(actualBoss._id)
    }
    return true;
}

async function loadDPS(id) {
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

async function updateBossData() {
    if (!updatingData) {
        updatingData = true;
        var query = { enable: true };
        var value = { $set: { actHP: actualBoss.actHP } };
        MongoDB.update(collection_boss, query, value, function (result) {
            updatingData = false;
        });
    }
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

module.exports.start = async function () {
    const isBossLoaded = await loadBoss();
    if (!isBossLoaded) throw new Error('No boss found');
    console.log("Boss - OK");
    while (true) {
        await sleep(1000);
        actualBoss.actHP -= totaldps;
        updateBossData();
        if (actualBoss.actHP <= 0) {
            await battleEnd();
        }
    }
}

module.exports.isFighting = function (id) {
    return fighting.includes(id);
}