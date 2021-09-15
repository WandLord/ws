const CryptoJS = require('crypto-js/core');
CryptoJS.Rabbit = require("crypto-js/rabbit");

class CryptoManager{

    generateId(peper) {
        return crypto.createHash('sha1').update(peper + crypto.randomBytes(16)).digest('hex');
    }
    encryptUserId(userId) {
        return CryptoJS.Rabbit.encrypt(userId, process.env.CRYPTO_PRIVATE_KEY);
    }
    
    decryptUserId(encryptedUserId) {
        return CryptoJS.Rabbit.decrypt(encryptedUserId, process.env.CRYPTO_PRIVATE_KEY);
    }
}

module.exports = new CryptoManager();
