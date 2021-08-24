const express = require("express");
const BossManager = express();
const MongoDB = require('../Connectors/ConnectorMongoDB');
const collection_boss = "boss";

var actualBoss = {};
var totaldps = 0;
var updatingData = false;
var fithing = [];

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
    fithing.push(id);
}
module.exports.leftPlayer = function (id, _dps) {
    totaldps -= _dps;
    var index = fithing.indexOf(id);
    if (index > -1) {
        fithing.splice(index, 1);
    }
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
            if (user.figth == true) {
                fithing.push(key);
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

module.exports.start = async function () {
    await loadBoss();
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

module.exports.isFithing = function (id) {
    return fithing.includes(id);
}