const PARAMS = require('../utils/Constants');
const Crypto = require('./CryptoManager');
const Errors = require('../utils/Errors');

class WeaponManager {

    forgeWeapon(_weapon1, _weapon2) {
        try {
            var _dps = ((_weapon1.dps + _weapon2.dps) / 2) + global.PARAMS.WEAPON_INCREMENT_FORGE;
            var newWeapon = {
                dps: _dps,
                icon: _generateRandomIcon(),
                rarity: _getRarity(_dps)
            };
            weaponId = Crypto.generateId(JSON.stringify(newWeapon));
            newWeapon.forges = 0;
            newWeapon.level = 0;
            return { weaponId, newWeapon };
        } catch (err) {
            logger.SystemError({ method: "WeaponManager.forgeWeapon", data: { _weapon1, _weapon2 }, payload: err });
            throw new Errors.INVALID_FORGE();
        }
    }

    extract(_weapon) {
        incDPS = _weapon.dps * global.PARAMS.WEAPON_EXTRACTOR_INC;
        return incDPS;
    }

    createWeapon() {
        //TODO hablar del tema de las armas
        const weapon =
        {
            dps: global.PARAMS.WEAPON_DPS_DEFAULT,
            icon: _generateRandomIcon(),
            rarity: "common"
        }
        weapon.level = 0;
        const weaponId = Crypto.generateId(JSON.stringify(weapon));
        weapon.forges = 0;

        return [weaponId, weapon];
    }

    _generateRandomIcon() {
        return Math.floor(Math.random() * (global.PARAMS.WEAPON_ICON_RANGE[1] - global.PARAMS.WEAPON_ICON_RANGE[0]) + global.PARAMS.WEAPON_ICON_RANGE[0]);
    }

    _getRarity(dps) {
        for (var k in global.PARAMS.WEAPON_RARITY) {
            if (dps < k) return global.PARAMS.WEAPON_RARITY[k];
        }
        return global.PARAMS.WEAPON_RARITY[10000];
    }
}
module.exports = new WeaponManager();