const PARAMS = require('../Constants');
const Crypto = require('./ManagerCrypto');


module.exports.forgeWeapon = function (_weapon1, _weapon2, callback) {

    var _dps = ((_weapon1.dps + _weapon2.dps) / 2) + global.PARAMS.WEAPON_INCREMENT_FORGE;
    var newWeapon = {
        dps: _dps,
        icon: generateRandomIcon(),
        rarity: getRaity(_dps)
    };
    weaponID = Crypto.generateID(JSON.stringify(newWeapon));
    newWeapon.forges = 0;
    newWeapon.level = 0;
    callback(weaponID, newWeapon);
}

module.exports.extract = function (_weapon, callback) {
    console.log(_weapon);
    incDPS = _weapon.dps * global.PARAMS.WEAPON_EXTRACTOR_INC; 
    console.log(incDPS);
    callback(incDPS);
}

module.exports.createWeapon = function () {
    var weapon =
    {
        dps: global.PARAMS.WEAPON_DPS_DEFAULT,
        icon: generateRandomIcon(),
        rarity: "common"
    }
    weapon.level= 0;
    var weaponID = Crypto.generateID(JSON.stringify(weapon));
    weapon.forges = 0;

    return [weaponID, weapon];
}

function generateRandomIcon() {
    return Math.floor(Math.random() * (global.PARAMS.WEAPON_ICON_RANGE[1] - global.PARAMS.WEAPON_ICON_RANGE[0]) + global.PARAMS.WEAPON_ICON_RANGE[0]);
}

function getRaity(dps){
    for (var k in global.PARAMS.WEAPON_RARITY){
        if(dps < k) return global.PARAMS.WEAPON_RARITY[k];
    }

}