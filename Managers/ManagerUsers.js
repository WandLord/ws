const PARAMS = require('../Constants');
const MongoDB = require('../Connectors/ConnectorMongoDB');
const BossManager = require('./ManagerBoss');
const Weapon = require('./ManagerWeapon');
const collectionusers = "users";
const collection_boss = "boss";


function validateForge(userID, _weapon1, _weapon2, callback) {

    //TODO REFACTOR IFs
    getUserData(userID, function (result) {
        if (_weapon1 == _weapon2) return callback(false, 0, null);
        var weapon1 = result.inventory[_weapon1];
        if (weapon1.length <= 0) return callback(false, 0, null);
        var weapon2 = result.inventory[_weapon2];
        if (weapon2.length <= 0) return callback(false, 0, null);
        weapon1.forges = weapon1.forges > 4 ? 4 : weapon1.forges;
        weapon2.forges = weapon2.forges > 4 ? 4 : weapon2.forges;
        var price = global.PARAMS.FORGE_PRICE[weapon1.forges] + global.PARAMS.FORGE_PRICE[weapon2.forges];
        if (price > result.balance) return callback(false, 0, null);
        callback(true, price, result);
    });
}

function validateExtract(userID, _weapon1, _weapon2, callback) {
    getUserData(userID, function (result) {
        if (Object.keys(result.inventory).length <= 2) return callback(false, null);
        if (result.equipWeapon == result) return callback(false, null);
        if (_weapon1 == _weapon2) return callback(false, null);
        if (!result.inventory.hasOwnProperty(_weapon1)) return callback(false, null);
        if (!(result.inventory[_weapon1].level < global.PARAMS.WEAPON_MAX_LEVEL)) return callback(false, null)
        if (!result.inventory.hasOwnProperty(_weapon2)) return callback(false, null);
        callback(true, result);
    });
}

function validateEquip(userID, weapon, callback) {
    getUserData(userID, function (result) {
        if (!result.inventory.hasOwnProperty(weapon)) return callback(false);
        callback(true);
    });

}

module.exports.forge = function (userID, _weaponID1, _weaponID2, callback) {
    validateForge(userID, _weaponID1, _weaponID2, function name(result, price, user) {
        if (result) {
            Weapon.forgeWeapon(user.inventory[_weaponID1], user.inventory[_weaponID2], function (_newWeaponID, _newWeapon) {
                forgeUpdateData(user._id, _weaponID1, _weaponID2, _newWeaponID, _newWeapon, price, function (result) {
                    if(result)return callback(_newWeapon);
                    callback(result);
                })
            });
        }
        else {
            //TODO INTENTO DE FORJA SOSPECHOSO
            console.log("INTENTO DE FORJA SOSPECHOSO");
            callback(false);
        }
    });
}

module.exports.extract = function (userID, _weaponID1, _weaponID2, callback) {
    validateExtract(userID, _weaponID1, _weaponID2, function name(result, user) {
        if (result) {
            Weapon.extract(user.inventory[_weaponID2], function (dps) {
                extractUpdateData(user._id, _weaponID1, _weaponID2, dps, function (result) {
                    callback(result);
                })
            });
        }
        else {
            //TODO INTENTO DE EXTRACCION SOSPECHOSO
            console.log("INTENTO DE EXTRACCION SOSPECHOSO");
            callback(false);
        }
    });
}

module.exports.updateUserData = function (user, callback) {
    var value = { $set: user };
    var query = { _id: user._id };
    delete user._id;
    MongoDB.update(collectionusers, query, value, function (result) {
        callback(result);
    });
}

function forgeUpdateData(userID, _oldWeapon1, _oldWeapon2, _newWeaponID, _newWeapon, _price, callback) {
    _oldWeapon1 = "inventory." + _oldWeapon1 + ".forges";
    _oldWeapon2 = "inventory." + _oldWeapon2 + ".forges";
    _newWeaponID = "inventory." + _newWeaponID;
    var value = { $inc: { balance: (_price * -1), [_oldWeapon1]: 1, [_oldWeapon2]: 1 }, $set: { [_newWeaponID]: _newWeapon } };
    var query = { _id: userID };
    MongoDB.update(collectionusers, query, value, function (result) {
        callback(result);
    });
}

function extractUpdateData(userID, mainWeaponID, destroyWeaponID, dps, callback) {
    console.log(dps);
    _mainWeaponDPS = "inventory." + mainWeaponID + ".dps";
    _mainWeaponLevel = "inventory." + mainWeaponID + ".level";
    _destroyWeapon = "inventory." + destroyWeaponID;
    var query = { _id: userID };
    var value = { $inc: { [_mainWeaponDPS]: dps, [_mainWeaponLevel]: 1 }, $unset: { [_destroyWeapon]: "" } };
    MongoDB.update(collectionusers, query, value, function (result) {
        callback(result);
    });
}

module.exports.equipWeapon = function (id, weapon, callback) {
    validateEquip(id, weapon, function (result) {
        if (result) {
            var query = { _id: MongoDB.createID(id) };
            var value = { $set: { currentWeapon: weapon } };
            MongoDB.update(collectionusers, query, value, function (result) {
                callback(result);
            });
        }
        else {
            callback(false);
        }
    });
}

module.exports.createUser = function (userID, userName, callback) {
    var weapon1 = Weapon.createWeapon();
    var weapon2 = Weapon.createWeapon();
    var user =
    {
        _id: MongoDB.createID(userID),
        name: userName,
        balance: 0,
        currentWeapon: null,
        register: new Date().toISOString(),
        skin: global.PARAMS.PLAYER_DEFAULT_SKIN,
        inventory:
        {
            [weapon1[0]]: weapon1[1],
            [weapon2[0]]: weapon2[1],

        }
    }
    MongoDB.insert(collectionusers, user, function (result) {
        callback(result);
    })
}

module.exports.login = function (userID, callback) {
    getUserData(userID, function (result) {
        if (result != null) {
            UpdateLasJoin(userID);
            delete result.register;
            delete result.lastJoin;
            callback(result);
        } else {
            callback(false);
        }
    });
}

function getUserData(userID, callback) {
    var query = { _id: MongoDB.createID(userID) };
    MongoDB.findOne(collectionusers, query, {}, function (result) {
        callback(result);
    });
}

var findUserInBoss = function (_layer, userID, callback) {
    var query = { layer: _layer };
    var _figthing = "fighting." + userID;
    var _fields = { projection: { [_figthing]: 1, _id: 0 } };
    MongoDB.findOneByFields(collection_boss, query, _fields, function (result) {
        callback(result);
    });
}

function changeFigthingStatus(userID, bool, callback) {
    var query = { _id: MongoDB.createID(userID) };
    value = { $set: { fighting: bool } };
    MongoDB.update(collectionusers, query, value, function (result) {
        callback(result);
    });
}

module.exports.joinBattle = function (_user, callback) {
    getUserData(_user, function (user) {
        if (user != false || user.fighting == true) {
            var boss = BossManager.Status();
            changeFigthingStatus(_user, true, function (figthing) {
                console.log(figthing);
                var userField1 = "fighting." + _user + ".dps";
                var userField2 = "fighting." + _user + ".figth";
                var userField3 = "fighting." + _user + ".lastJoin";
                var quey = { layer: boss.layer };
                var value = { $set: { [userField1]: user.inventory[user.currentWeapon].dps, [userField2]: true, [userField3]: new Date().toISOString() } };
                if (figthing) {
                    MongoDB.update(collection_boss, quey, value, function (result) {
                        BossManager.joinPlayer(_user,user.inventory[user.currentWeapon].dps);
                        callback(result);
                    })
                }
                else {
                    callback(false);
                }
            });
        } else {
            callback("hacker?");
        }
    });
}

module.exports.leftBattle = function (_user, callback) {
    var boss = BossManager.Status();
    findUserInBoss(boss.layer, _user, function (bossUserData) {
        bossUserData = bossUserData.fighting["611a3a10ce221181b313e83d"];
        if (bossUserData != false) {
            changeFigthingStatus(_user, false, function (figthing) {
                var userField1 = "fighting." + _user + ".totalDPS";
                var userField2 = "fighting." + _user + ".figth";
                var quey = { layer: boss.layer };
                var _totaldps = ((new Date().getTime() - new Date(bossUserData.lastJoin).getTime()) / 1000) * bossUserData.dps;
                var value = { $inc: { [userField1]: _totaldps }, $set: { [userField2]: false } };
                if (figthing) {
                    MongoDB.update(collection_boss, quey, value, function (result) {
                        BossManager.leftPlayer(_user, bossUserData.dps);
                        callback(result);
                    })
                }
                else {
                    callback(false);
                }
            });
        } else {
            callback("hacker?");
        }

    });
}

async function UpdateLasJoin(userID) {
    var quey = { _id: MongoDB.createID(userID) };
    var value = { $set: { lastJoin: new Date().toISOString() } };
    MongoDB.update(collectionusers, quey, value, function (result) {
        console.log(result);
    })
}

module.exports.refer = function (id, code, callback){
    var quey = { _id: MongoDB.createID(id) };
    var value = { $set: { refer: code } };
    MongoDB.update(collectionusers, quey, value, function (result) {
        callback(result);
    })
}