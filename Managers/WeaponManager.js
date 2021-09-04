const PARAMS = require('../Constants');
const Crypto = require('./CryptoManager');


module.exports.forgeWeapon = function (_weapon1, _weapon2) {

    var _dps = ((_weapon1.dps + _weapon2.dps) / 2) + global.PARAMS.WEAPON_INCREMENT_FORGE;
    var newWeapon = {
        dps: _dps,
        icon: generateRandomIcon(),
        rarity: getRarity(_dps)
    };
    weaponId = Crypto.generateId(JSON.stringify(newWeapon));
    newWeapon.forges = 0;
    newWeapon.level = 0;
    return {weaponId, newWeapon};
}

module.exports.extract = function (_weapon) {
    incDPS = _weapon.dps * global.PARAMS.WEAPON_EXTRACTOR_INC; 
    return incDPS;
}

module.exports.createWeapon = function () {
    var weapon =
    {
        dps: global.PARAMS.WEAPON_DPS_DEFAULT,
        icon: generateRandomIcon(),
        rarity: "common"
    }
    weapon.level= 0;
    var weaponId = Crypto.generateId(JSON.stringify(weapon));
    weapon.forges = 0;

    return [weaponId, weapon];
}

function generateRandomIcon() {
    return Math.floor(Math.random() * (global.PARAMS.WEAPON_ICON_RANGE[1] - global.PARAMS.WEAPON_ICON_RANGE[0]) + global.PARAMS.WEAPON_ICON_RANGE[0]);
}

function getRarity(dps){
    for (var k in global.PARAMS.WEAPON_RARITY){
        if(dps < k) return global.PARAMS.WEAPON_RARITY[k];
    }

}