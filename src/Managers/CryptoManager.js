const CryptoJS = require("crypto-js");
class CryptoManager{

    generateId(peper) {
        const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA1, CryptoJS.lib.WordArray.random(16));
        hmac.update(CryptoJS.lib.WordArray.create(peper))
        return hmac.finalize().toString();
    }
    encrypt(userId) {
        return CryptoJS.AES.encrypt(userId, process.env.CRYPTO_PRIVATE_KEY).toString();
    }
    
    decrypt(encryptedUserId) {
        const bytes = CryptoJS.AES.decrypt(encryptedUserId, process.env.CRYPTO_PRIVATE_KEY);
        return bytes.toString(CryptoJS.enc.Utf8);
    }
}

module.exports = new CryptoManager();