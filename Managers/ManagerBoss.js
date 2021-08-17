const express = require("express");
const BossManager = express();

var actualBoss = {};
var players = [];
var totaldps = 0;

module.exports.Status = function () {
    return actualBoss;
}

module.exports.start = async function () {
    generateBoss();
    while (true) {
        await sleep(1000);
        actualBoss.actHP -= totaldps;
        console.log(actualBoss.actHP)
        if(actualBoss.actHP <= 0){
            await battleEnd();
            generateBoss();
        }
    }
}

async function battleEnd(){
    totaldps = [];
}

function generateBoss() {
    console.log("New Boss Generate");
    actualBoss = {
        name: 'Boss 1',
        image: 'boss_1',
        maxHP: 100,
        actHP: 100,
        layer: 1
    };
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }  