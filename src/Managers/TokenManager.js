const jwt = require("jsonwebtoken");
const Params = require('../utils/Constants');
const Errors = require('../utils/Errors');

class TokenManager {

    createToken(id) {
        return jwt.sign({ id }, Params.TOKEN_KEY, { expiresIn: Params.TOKEN_EXPIRATION_TIME, });
    }

    validateToken(token, id) {
        try {
            token = token.replace("Bearer ", "");
            const decoded = jwt.verify(token, Params.TOKEN_KEY);
            if (decoded.id == id) return this.createToken(id);
            logger.SystemError({ method: "TokenManager.validateToken", data: { token, id }, payload: Errors.TOKEN_VALIDATION() });
            throw new Errors.TOKEN_VALIDATION();
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "TokenManager.validateToken", data: { token, id }, payload: err });
            throw new Errors.TOKEN_VALIDATION();
        }
    }
}
module.exports = new TokenManager();