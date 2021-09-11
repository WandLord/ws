const jwt = require("jsonwebtoken");
const PARAMS = require('../utils/Constants');
const ERRORS = require('../utils/Errors');


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
        token = token.replace("Bearer ", "");
        const decoded = jwt.verify(token, global.PARAMS.TOKEN_KEY);
        if (decoded.id == id) return module.exports.createToken(id);
    } catch (err) {
        throw new Error(ERRORS.ERRORS.TOKEN_VALIDATION.MSG);
    }
}