const Oauth = require('simple-oauth2');
const User = require('./UserManager');
const Got = require('got');
const Moment = require('moment');
const dotenv = require('dotenv');

dotenv.config();

let redirectUri = process.env.ENVIRONMENT === 'development' ? 'localhost' : process.env.PRODUCTION_IP;
redirectUri += `:${process.env.LISTEN || '3000'}`;
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
module.exports.generateUrl = async function (id) {
    const authorizationUri = client.authorizeURL({
        redirect_uri: `http://${redirectUri}/auth`,
        state: id,
        scope: 'email',
    });
    checkAuthAlive();
    userPool.push({ id, status: "waiting", createdAt: new Date() });
    return authorizationUri;
}

module.exports.validateOauth = async function (options, id) {
    options.redirect_uri = `http://${redirectUri}/auth`,
        options.scope = 'email';
    options.state = id;
    const authToken = await client.getToken(options);
    const urlUserInfo = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + authToken.token.access_token;
    const data = JSON.parse((await Got(urlUserInfo)).body);
    const auxId = userPool.findIndex(item => item.id == id);
    userPool[auxId].status = "OK";
    let user = await User.getUserDataByOauth(data.id);
    if (!user) {
        user = await User.createUser(data.id);
    }
    userPool[auxId].data = user;

    return user;
}

module.exports.checkAuth = async function (id) {
    const auxId = userPool.findIndex(item => item.id == id);
    if (!userPool[auxId]) return "dont find";
    const userAux = { ...userPool[auxId] };
    if (userAux.status === 'OK' && Moment(userAux.createdAt).add(process.env.AUTH_DURATION, 'minute') >= Moment()) {
        userPool.splice(auxId, 1);
        return userAux.data;
    }
    return userAux.status;
}

function checkAuthAlive() {
    userPool.forEach((auth, index, object) => {
        if (Moment(auth.createdAt).add(process.env.AUTH_DURATION, 'minute') >= Moment()) {
            object.splice(index, 1);
        }
    });
}