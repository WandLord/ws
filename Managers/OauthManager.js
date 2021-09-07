const Oauth = require('simple-oauth2');
const User = require('./UserManager');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const userPool = [];
const client = new Oauth.AuthorizationCode({
    client: {
        id: '511994452392-rm44tkcm5vrurntcnr6p9pfhbc7pnpvi.apps.googleusercontent.com',
        secret: '7DXBG51d76qbGF0ql5B8jxro'
    },
    auth: {
        tokenHost: 'https://accounts.google.com/o/oauth2/',
        authorizePath: 'auth',
        tokenPath: 'token'
    }
});
module.exports.generateUrl = async function (id) {
    const authorizationUri = client.authorizeURL({
        redirect_uri: 'http://31.214.245.211:3000/auth?id=' + id,
        scope: 'email',
    });
    userPool.push({ id, status: "waiting" });
    return authorizationUri;
}

module.exports.validateOauth = async function (options, id) {
    options.redirect_uri = 'http://31.214.245.211:3000/auth?id=' + id;
    options.scope = 'email';
    const authToken = await client.getToken(options);
    const urlUserInfo = "https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + authToken.token.access_token;
    const response = await fetch(urlUserInfo);
    const data = await response.json();
    const auxId = userPool.findIndex(item => item.id == id);
    userPool[auxId].status = "OK";
    userPool[auxId].user = data.id;
    return;
}

module.exports.checkAuth = async function (id) {
    userAuth = userPool.find(item => item.id == id);
    if (!userAuth) return "dont find";
    if (userAuth.status == "OK") {
        var user = await User.getUserDataByOauth(userAuth.user);
        if (!user) {
            user =  await User.createUser(userAuth.user);
        }
        delete user.register;
        delete user.lastJoin;
        delete user.accounts;
        return user;
    }
    return userAuth.status;
}