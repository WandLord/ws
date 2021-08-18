const PARAMS = require('../Constants');
const Crypto = require('./ManagerCrypto');


module.exports.forgeWeapon = function (_weapon1, _weapon2, callback) {

    var newWeapon = {
        dps: ((_weapon1.dps + _weapon2.dps) / 2) + global.PARAMS.WEAPON_INCREMENT_FORGE,
        icon: generateRandomIcon(),
    };
    weaponID = Crypto.generateID(JSON.stringify(newWeapon));
    newWeapon.forges = 0;
    callback(weaponID, newWeapon);
}

module.exports.createWeapon = function () {
    var weapon =
    {
        dps: global.PARAMS.WEAPON_DPS_DEFAULT,
        icon: generateRandomIcon(),
    }
    var weaponID = Crypto.generateID(JSON.stringify(weapon));
    weapon.forges = 0;

    return [weaponID, weapon];
}

function generateRandomIcon() {
    return Math.floor(Math.random() * (global.PARAMS.WEAPON_ICON_RANGE[1] - global.PARAMS.WEAPON_ICON_RANGE[0]) + global.PARAMS.WEAPON_ICON_RANGE[0]);
}