const PARAMS = require('../Constants');
const MongoDB = require('../Connectors/ConnectorMongoDB');
const BossManager = require('./ManagerBoss');
const Weapon = require('./ManagerWeapon');
const { exit } = require('process');
const collectionusers = "users";
const collection_boss = "boss";


function validateForge(userID, _weapon1, _weapon2, callback) {
    module.exports.getUserData(userID, function (result) {
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
    })
}

module.exports.forge = function (userID, _weaponID1, _weaponID2, callback) {
    validateForge(userID, _weaponID1, _weaponID2, function name(result, price, user) {
        if (result) {
            user.balance -= price;
            user.inventory[_weaponID1].forges += 1;
            user.inventory[_weaponID2].forges += 1;
            Weapon.forgeWeapon(user.inventory[_weaponID1], user.inventory[_weaponID2], function (_newWeaponID, _newWeapon) {
                user.inventory[_newWeaponID] = _newWeapon;
                forgeUpdateData(user._id, _weaponID1, _weaponID2, _newWeaponID, _newWeapon, price, function (result) {
                    callback(result);
                })
            });
        }
        else {
            //TODO INTENTO DE FORGA SOSPECHOSO
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

module.exports.createUser = function (userID, userName, callback) {
    var weapon1 = Weapon.createWeapon();
    var weapon2 = Weapon.createWeapon();
    var user =
    {
        _id: MongoDB.createID(userID),
        name: userName,
        balance: 0,
        currentWeapon: null,
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
var getUserData = function (userID, callback) {
    var query = { _id: MongoDB.createID(userID) };
    MongoDB.findOne(collectionusers, query, function (result) {
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
                var value = { $set: { [userField1]: user.inventory[user.currentWeapon].dps, [userField2]:  true, [userField3]: new Date().toISOString()} };
                if (figthing) {
                    MongoDB.update(collection_boss, quey, value, function (result) {
                        BossManager.joinPlayer(user.inventory[user.currentWeapon].dps);
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
                var value = { $inc: { [userField1]: _totaldps }, $set: {[userField2] : false} };
                if (figthing) {
                    MongoDB.update(collection_boss, quey, value, function (result) {
                        BossManager.joinPlayer(bossUserData.dps * -1);
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