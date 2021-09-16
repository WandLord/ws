const Oauth = require('simple-oauth2');
const Moment = require('moment');
const Got = require('got');
const User = require('./UserManager');
const Errors = require('../utils/Errors');

const redirectUri = (process.env.ENVIRONMENT === 'development' ? 'localhost' : process.env.PRODUCTION_IP) + (`:${process.env.LISTEN || '3000'}`);
const userPool = [];

const client = new Oauth.AuthorizationCode({
    client: {
        id: process.env.OAUTH_ID,
        secret: process.env.OAUTH_SECRET
    },
    auth: {
        tokenHost: 'https://accounts.google.com/o/oauth2/',
        authorizePath: 'auth',
        tokenPath: 'token'
    }
});
class OauthManager {

    async generateUrl(id) {
        try {
            const authorizationUri = client.authorizeURL({
                redirect_uri: `http://${redirectUri}/auth`,
                state: id,
                scope: 'email',
            });
            this._checkAuthAlive();
            const auxId = userPool.findIndex(item => item.id == id);
            if (userPool[auxId]) delete userPool[auxId];
            userPool.push({ id, status: "waiting", createdAt: new Date() });
            return authorizationUri;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "OauthManager.generateUrl", data: { id }, payload: Errors.AUTH_URL() });
            throw Errors.AUTH_URL();
        }

    }

    async validateOauth(options, id) {
        try {
            options.redirect_uri = `http://${redirectUri}/auth`,
                options.scope = 'email';
            options.state = id;
            const authToken = await client.getToken(options);
            const urlUserInfo = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + authToken.token.access_token;
            const data = JSON.parse((await Got(urlUserInfo)).body);
            const auxId = userPool.findIndex(item => item && item.id == id);
            if (auxId == -1) return null;
            userPool[auxId].status = "OK";
            let user = await User.getUserDataByOauth(data.id);
            if (!user) {
                user = await User.createUser(data.id);
            }
            userPool[auxId].data = user;
            return user;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "OauthManager.update", data: { options, id }, payload: Errors.AUTH_VALIDATE() });
            throw Errors.AUTH_VALIDATE();
        }

    }

    async checkAuth(id) {
        try {
            const auxId = userPool.findIndex(item => item.id == id);
            if (!userPool[auxId]) return "dont find";
            const userAux = { ...userPool[auxId] };
            if (userAux.status === 'OK' && Moment(userAux.createdAt).add(process.env.AUTH_DURATION, 'seconds') >= Moment()) {
                userPool.splice(auxId, 1);
                return userAux.data;
            }
            return userAux.status;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemError({ service: "OauthManager.checkAuth", data: { id }, payload: Errors.AUTH_CHECKOUT() });
            throw Errors.AUTH_CHECKOUT();
        }
    }

    _checkAuthAlive() {
        try {
            userPool.forEach((auth, index, object) => {
                if (Moment(auth.createdAt).add(process.env.AUTH_DURATION, 'seconds') >= Moment()) object.splice(index, 1);
            });
        } catch (err) {
            logger.SystemCritical({ service: "OauthManager._checkAuthAlive", data: { userPool }, payload: err });
        }
    }
}
module.exports = new OauthManager();