const { MongoClient } = require('mongodb');
var ObjectID = require('mongodb').ObjectId;


const uri = "mongodb://teixi:ME60bHJgtFeya8v60x45@31.214.245.211:27017/forge-and-raid?retryWrites=true&w=majority";
const client = new MongoClient(uri);
var db = {};


module.exports.find = function (_collection, query, fields, callback) {
    db.collection(_collection).find(query, fields).toArray(function (err, result) {
        if (err) return callback(false);
        callback(result);
    });
}
module.exports.findOne = function (_collection, query, fields, callback) {
    db.collection(_collection).findOne(query, fields, function (err, result) {
        if (err) return callback(false);
        callback(result);
    });
}
module.exports.findOneByFields = function (_collection, query, fields, callback) {
    db.collection(_collection).findOne(query, fields, function (err, result) {
        if (err) return callback(false);
        callback(result);
    });
}
module.exports.update = function (_collection, query, value, callback) {
    db.collection(_collection).updateOne(query, value, function (err, result) {
        if (err) return callback(false);
        callback(true);
    });
}

module.exports.insert = function (_collection, value, callback) {
    db.collection(_collection).insertOne(value, function (err, result) {
        if (err) return callback(false);
        callback(true);
    });
}

module.exports.delete = function (_collection, query, callback) {
    db.collection(_collection).deleteOne(query, function (err, result) {
        if (err) return callback(false);
        callback(true);
    });
}


module.exports.connect = async function () {
    console.log("Creando Conecxiona MongoDB...");
    await client.connect();
    db = client.db("dragonchain");
    console.log("Conecxion con MongoDB creada correctamente...")
}

module.exports.createID = function (id) {
    var response = null;
    try {
        response = new ObjectID(id);
    } catch (err) {
        response = false;
    }
    return response;
}