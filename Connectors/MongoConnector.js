const { MongoClient } = require('mongodb');
var ObjectId = require('mongodb').ObjectId;

const uri = "mongodb://root:ñRC1Gc2rMJpYPGb2ECC1rñ@31.214.245.211:27017/";
const client = new MongoClient(uri);
var db = {};


module.exports.find = async function (_collection, query, fields) {
    return await db.collection(_collection).find(query, fields).toArray();
}

module.exports.findOne = async function(_collection, query, fields) {
    return await db.collection(_collection).findOne(query, fields);
}

module.exports.findOneByFields = async function (_collection, query, fields) {
    return await db.collection(_collection).findOne(query, fields);
}

module.exports.update = async function (_collection, query, value) {
    return (await db.collection(_collection).updateOne(query, value)).modifiedCount > 0;
}

module.exports.insert = async function (_collection, value) {
    return await db.collection(_collection).insertOne(value);
}

module.exports.delete = function (_collection, query, callback) {
    db.collection(_collection).deleteOne(query, function (err, result) {
        if (err) return callback(false);
        callback(true);
    });
}

module.exports.connect = async function () {
    await client.connect();
    db = client.db("wandlord-db");
    console.log("MongoDB - OK");
}

module.exports.createId = function (id) {
    var response = null;
    try {
        response = new ObjectId(id);
    } catch (err) {
        response = false;
    }
    return response;
}
module.exports.createNewId = function () {
    var response = null;
    try {
        response = new ObjectId();
    } catch (err) {
        response = false;
    }
    return response;
}