const express = require("express");
const BossManager = express();
const MongoDB = require('../Connectors/ConnectorMongoDB');
const collection_boss = "boss";

var actualBoss = {};
var totaldps = 0;

module.exports.Status = function () {
    return actualBoss;
}

module.exports.start = async function () {
    await loadBoss();
    while (true) {
        await sleep(1000);
        actualBoss.actHP -= totaldps;
        if (actualBoss.actHP <= 0) {
            await battleEnd();
            loadBoss();
        }
    }
}

async function battleEnd() {
    actualBoss.status = "disable";
    totaldps = 0;

    loadBoss();
}

module.exports.joinPlayer = function (_dps) {
    totaldps += _dps;
}

function loadBoss() {
    var query = {};
    MongoDB.find(collection_boss, query, function (result) {
        actualBoss = result[0];
    });
}

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}