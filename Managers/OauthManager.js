const Oauth = require('simple-oauth2');
const User = require('./UserManager');
const Got = require('got');

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
    userPool.push({ id, status: "waiting" });
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
    delete user.register;
    delete user.lastJoin;
    delete user.accounts;
    userPool[auxId].data = user;
    
    return user;
}

module.exports.checkAuth = async function (id) {
    userAuth = userPool.find(item => item.id == id);
    if (!userAuth) return "dont find";
    if (userAuth.status === 'OK') return userAuth.data;
    return userAuth.status;
}