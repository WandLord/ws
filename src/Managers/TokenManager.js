const jwt = require("jsonwebtoken");
const Errors = require('../utils/Errors');
const logger = require('../utils/Logger');

class TokenManager {

    createToken(id) {
        return jwt.sign({ id }, process.env.TOKEN_PRIVATE_KEY, { expiresIn: process.env.TOKEN_EXPIRATION_TIME, });
    }

    validateToken(token, id) {
        try {
            token = token.replace("Bearer ", "");
            const decoded = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY);
            if (decoded.id == id) return this.createToken(id);
            logger.SystemError({ service: "TokenManager.validateToken", data: { token, id }, payload: Errors.TOKEN_VALIDATION() });
            throw Errors.TOKEN_VALIDATION();
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "TokenManager.validateToken", data: { token, id }, payload: err });
            throw Errors.TOKEN_VALIDATION();
        }
    }
}
module.exports = new TokenManager();