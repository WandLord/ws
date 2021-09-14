const CryptoJS = require('crypto-js/core');
CryptoJS.Rabbit = require("crypto-js/rabbit");

const dotenv = require('dotenv');
dotenv.config();

module.exports.generateId = function (peper) {
    const sha1 = crypto.createHash('sha1');
    const strObj = peper + crypto.randomBytes(16);

    return sha1.update(strObj).digest('hex');
}

module.exports.encryptUserId = function (userId) {
    return CryptoJS.Rabbit.encrypt(userId, process.env.CRYPTO_PRIVATE_KEY);
}

module.exports.decryptUserId = function (encryptedUserId) {
    return CryptoJS.Rabbit.decrypt(encryptedUserId, process.env.CRYPTO_PRIVATE_KEY);
}