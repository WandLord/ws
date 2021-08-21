const express = require("express");
const BossManager = express();
const MongoDB = require('../Connectors/ConnectorMongoDB');
const collection_boss = "boss";

var actualBoss = {};
var totaldps = 0;
var updatingData = false;

module.exports.Status = function () {
    return actualBoss;
}

module.exports.start = async function () {
    await loadBoss();
    while (true) {
        await sleep(1000);
        actualBoss.actHP -= totaldps;
        updateBossData();
        if (actualBoss.actHP <= 0) {
            await battleEnd();
        }
    }
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

module.exports.joinPlayer = function (_dps) {
    totaldps += _dps;
}

async function loadBoss() {
    var query = { enable: true };
    var order = { projection: { fighting: 0 } };
    MongoDB.findOne(collection_boss, query, order, function (result) {
        if (result.actHP <= 0) {
            battleEnd();
        } else {
            if (result.enable == true) {
                actualBoss = result;
                loadDPS(actualBoss._id)
            }
        }
    });

}

async function loadDPS(id) {
    var query = { _id: id };
    var order = {};
    MongoDB.findOne(collection_boss, query, order, function (result) {
        Object.keys(result.fighting).forEach(function (key) {
            var user = result.fighting[key];
            console.log(user);
            if (user.figth == true) {
                totaldps += user.dps;
            }
        });
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