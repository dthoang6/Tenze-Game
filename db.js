const dotenv = require("dotenv");
dotenv.config(); //the package will load in all of the values that we defined within our .env file.
const { MongoClient } = require("mongodb");

const client = new MongoClient(process.env.CONNECTIONSTRING);

async function start() {
  await client.connect();
  module.exports = client; //return database object so that if we require this file db.js from within another file, it's going to return the database that we can work with.
  //staring up our express app file after establish a connection to our database.
  const app = require("./app");
  app.listen(process.env.PORT);
}

start();
