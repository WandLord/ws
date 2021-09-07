const crypto = require('crypto')


module.exports.generateId = function (peper) {
    const sha1 = crypto.createHash('sha1');
    const strObj = peper + crypto.randomBytes(16);

    return sha1.update(strObj).digest('hex');
}

module.exports.ofuscateId = function (userId) {
    return crypto.createHash('sha1').update(userId).digest('hex');
}