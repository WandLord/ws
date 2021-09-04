const crypto = require('crypto')


module.exports.generateId = function (peper) {
    var sha1 = crypto.createHash('sha1');
    var strObj = peper + crypto.randomBytes(16);

    return sha1.update(strObj).digest('hex');
}