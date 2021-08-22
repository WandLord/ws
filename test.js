/* test-connection.js */
/*const mongoose = require('mongoose')
const uri = "mongodb://31.214.245.211:27017";
mongoose.connect(uri, { useNewUrlParser: true })

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', function() {
  console.log('## SUCCESS ¤¤')
})
*/
const { MongoClient } = require('mongodb');

const uri = "mongodb://31.214.245.211:27017/";
//const uri = "mongodb+srv://admin:admin@cluster0.k5bpd.mongodb.net/dragonchain?retryWrites=true&w=majority";
const client = new MongoClient(uri);

async function start(){
    console.log("Creando Conecxiona MongoDB...");
    await client.connect();
    console.log("Conecxion con MongoDB creada correctamente...")
}
start();
