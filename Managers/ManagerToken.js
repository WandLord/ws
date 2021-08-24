const jwt = require("jsonwebtoken");
const PARAMS = require('../Constants');


module.exports.createToken = function (id) {

    const token = jwt.sign(
        { id },
        global.PARAMS.TOKEN_KEY,
        {
            expiresIn: global.PARAMS.TOKEN_EXPIRATION_TIME,
        }
    );
    return token;
}

module.exports.validateToken = function (token, id) {
    try {
        const decoded = jwt.verify(token, global.PARAMS.TOKEN_KEY);
        if (decoded.id == id) return module.exports.createToken(id);
    } catch (err) {
        return false;
    }
    return false;
}