const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
const ERRORS = require('../utils/Errors');
dotenv.config();

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri);
var db = {};


module.exports.find = async function (_collection, query, fields) {
    return await db.collection(_collection).find(query, fields).toArray();
}

module.exports.findOne = async function(_collection, query, fields) {
    return await db.collection(_collection).findOne(query, fields);
}

module.exports.findDefinite = async function(_collection, query, fields) {
    const item = await db.collection(_collection).findOne(query, fields);
    if (!item) {
        throw new Error(ERRORS.ERRORS.DB_FIND_DEFINITE.MSG);
    }
    return item;
}

module.exports.findOneByFields = async function (_collection, query, fields) {
    return await db.collection(_collection).findOne(query, fields);
}

module.exports.update = async function (_collection, query, value) {
    const numberOfUpdatedItems = (await db.collection(_collection).updateOne(query, value)).modifiedCount;
    if (numberOfUpdatedItems === 0) {
        throw new Error(ERRORS.ERRORS.DB_UPDATE.MSG);
    }
    return numberOfUpdatedItems;
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
    db = client.db(process.env.DATABASE_CLIENT);
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