const CryptoJS = require("crypto-js");
const dotenv = require('dotenv');
dotenv.config();

class CryptoManager{

    generateId(peper) {
        return crypto.createHash('sha1').update(peper + crypto.randomBytes(16)).digest('hex');
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