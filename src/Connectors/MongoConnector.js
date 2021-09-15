const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const dotenv = require('dotenv');
const logger = require('../utils/Logger');
const Errors = require('../utils/Errors');
dotenv.config();

const uri = process.env.DATABASE_URI;
const client = new MongoClient(uri);
let db = {};

class MongoConnector {

    async find(_collection, query, fields) {
        try {
            const item = await db.collection(_collection).find(query, fields).toArray();
            if (!item) {
                logger.SystemError({ method: "MongoConnector.find", data: { _collection, query, fields }, payload: new Errors.DB_FIND_DEFINITE() });
                throw new Errors.DB_FIND_DEFINITE();
            }
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "MongoConnector.find", data: { _collection, query, fields }, payload: err });
            process.exit(1);
        }
    }

    async findOne(_collection, query, fields) {
        try {
            const item = await db.collection(_collection).findOne(query, fields);
            if (!item) {
                logger.SystemError({ method: "MongoConnector.findOne", data: { _collection, query, fields }, payload: new Errors.DB_FIND_DEFINITE() });
                throw new Errors.DB_FIND_DEFINITE();
            }
            return item;
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "MongoConnector.findOne", data: { _collection, query, fields }, payload: err });
            process.exit(1);
        }
    }

    async update(_collection, query, value) {
        try {
            const numberOfUpdatedItems = (await db.collection(_collection).updateOne(query, value)).modifiedCount;
            if (numberOfUpdatedItems === 0) {
                logger.SystemError({ method: "MongoConnector.update", data: { _collection, query, value }, payload: new Errors.DB_UPDATE_DEFINITE() });
                throw new Errors.DB_UPDATE_DEFINITE();
            }
            return true;
        } catch (err) {
            if (err instanceof Errors) throw err;
            logger.SystemError({ method: "MongoConnector.update", data: { _collection, query, value }, payload: err });
            process.exit(1);
        }
    }

    async insert(_collection, value) {
        try {
            return await db.collection(_collection).insertOne(value);
        } catch (err) {
            logger.SystemError({ method: "MongoConnector.insert", data: { _collection, value }, payload: err });
            process.exit(1);
        }
    }

    async connect() {
        try {
            await client.connect();
            db = client.db(process.env.DATABASE_CLIENT);
            console.log("MongoDB - OK")
        } catch (err) {
            logger.SystemError({ method: "MongoConnector.connect", data: { _collection, value }, payload: err });
            process.exit(1);
        }
    }

    createId(id) {
        let response = null;
        try {
            response = new ObjectId(id);
        } catch (err) {
            logger.SystemError({ method: "MongoConnector.CreateId", data: id, payload: new Errors.DB_CREATE_ID() });
            throw new Errors.DB_CREATE_ID();
        }
        return response;
    }

    createNewId() {
        return new ObjectId();
    }
}
module.exports = new MongoConnector();
