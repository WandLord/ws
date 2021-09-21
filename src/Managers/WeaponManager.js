const Params = require('../utils/Constants');
const Crypto = require('./CryptoManager');
const Errors = require('../utils/Errors');

class WeaponManager {

    forgeWeapon(_weapon1, _weapon2) {
        try {
            const _dps = ((_weapon1.dps + _weapon2.dps) / 2) + Params.WEAPON_INCREMENT_FORGE;
            const newWeapon = {
                dps: _dps,
                icon: this._generateRandomIcon(),
                rarity: this._getRarity(_dps)
            };
            const weaponId = Crypto.generateId(JSON.stringify(newWeapon));
            newWeapon.forges = 0;
            newWeapon.level = 0;
            return { weaponId, newWeapon };
        } catch (err) {
            console.log(err);
            logger.SystemError({ service: "WeaponManager.forgeWeapon", data: { _weapon1, _weapon2 }, payload: err });
            throw Errors.INVALID_FORGE();
        }
    }

    extract(_weapon) {
        const incDPS = _weapon.dps * Params.WEAPON_EXTRACTOR_INC;
        return incDPS;
    }

    createWeapon() {
        const weapon =
        {
            dps: Params.WEAPON_DPS_DEFAULT,
            icon: this._generateRandomIcon(),
            rarity: "common"
        }
        weapon.level = 0;
        const weaponId = Crypto.generateId(JSON.stringify(weapon));
        weapon.forges = 0;

        return [weaponId, weapon];
    }

    _generateRandomIcon() {
        return Math.floor(Math.random() * (Params.WEAPON_ICON_RANGE[1] - Params.WEAPON_ICON_RANGE[0]) + Params.WEAPON_ICON_RANGE[0]);
    }

    _getRarity(dps) {
        for (let k in Params.WEAPON_RARITY) {
            if (dps < k) return Params.WEAPON_RARITY[k];
        }
        return Params.WEAPON_RARITY[10000];
    }
}
module.exports = new WeaponManager();