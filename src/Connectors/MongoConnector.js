const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const logger = require('../utils/Logger');
const Errors = require('../utils/Errors');

const uri = process.env.DATABASE_URI;
let client = null;
let db = {};

class MongoConnector {

    async find(_collection, query, fields) {
        try {
            const item = await db.collection(_collection).find(query, fields).toArray();
            if (!item) {
                logger.SystemError({ service: "MongoConnector.find", data: { _collection, query, fields }, payload: Errors.DB_FIND_DEFINITE() });
                throw Errors.DB_FIND_DEFINITE();
            }
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemCritical({ service: "MongoConnector.find", data: { _collection, query, fields }, payload: err });
        }
    }

    async findOne(_collection, query, fields) {
        try {
            return await db.collection(_collection).findOne(query, fields);
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemCritical({ service: "MongoConnector.findOne", data: { _collection, query, fields }, payload: err });
        }
    }

    async findOneDefinite(_collection, query, fields) {
        try {
            const item = await db.collection(_collection).findOne(query, fields);
            if (!item) {
                logger.SystemError({ service: "MongoConnector.findOne", data: { _collection, query, fields }, payload: Errors.DB_FIND_DEFINITE() });
                throw Errors.DB_FIND_DEFINITE();
            }
            return item;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemCritical({ service: "MongoConnector.findOne", data: { _collection, query, fields }, payload: err });
        }
    }

    async update(_collection, query, value) {
        try {
            const response =  await db.collection(_collection).updateOne(query, value);
            const numberOfUpdatedItems = response.modifiedCount;
            if (numberOfUpdatedItems === 0) {
                logger.SystemError({ service: "MongoConnector.update", data: { _collection, query, value }, payload: Errors.DB_UPDATE_DEFINITE() });
                throw Errors.DB_UPDATE_DEFINITE();
            }
            return true;
        } catch (err) {
            if (!!err.code) throw err;
            logger.SystemCritical({ service: "MongoConnector.update", data: { _collection, query, value }, payload: err });
        }
    }
    async bulkWrite(_collection, bulk){
        const resp = await db.collection(_collection).bulkWrite(bulk);
        console.log(resp);
    }

    async count(_collection, query){
        try{
        const count =  await db.collection(_collection).countDocuments(query);
        if(isNaN(count)){
            logger.SystemError({ service: "MongoConnector.count", data: { _collection, query, count }, payload: Errors.DB_UPDATE_DEFINITE() });
            throw new Error("Count is not a number");
        }
        return count;
    } catch (err) {
        if (!!err.code) throw err;
        logger.SystemCritical({ service: "MongoConnector.count", data: { _collection, query }, payload: err });
    }
    }

    async insert(_collection, value) {
        try {
            return await db.collection(_collection).insertOne(value);
        } catch (err) {
            logger.SystemCritical({ service: "MongoConnector.insert", data: { _collection, value }, payload: err });
        }
    }

    async connect() {
        try {
            client = new MongoClient(uri);
            await client.connect();
            db = client.db(process.env.DATABASE_CLIENT);
            console.log("MongoDB - OK")
        } catch (err) {
            logger.SystemCritical({ service: "MongoConnector.connect", payload: err });
        }
    }

    createId(id) {
        let response = null;
        try {
            response = new ObjectId(id);
        } catch (err) {
            logger.SystemError({ service: "MongoConnector.CreateId", data: { id }, payload: Errors.DB_CREATE_ID() });
            throw Errors.DB_CREATE_ID();
        }
        return response;
    }

    createNewId() {
        return new ObjectId();
    }
}
module.exports = new MongoConnector();
