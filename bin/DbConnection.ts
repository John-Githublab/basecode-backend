const mongoose = require("mongoose");
const PrettyConsole = require("../utils/PrettyConsole.ts");

const prettyConsole = new PrettyConsole();

interface Connection {
  dbUrl: string;
}

// if there is not database then mongodb will not initialise. but if give db url then automatically create db instance
const dbConnection = (connection: Connection) => {
  if (connection?.dbUrl && connection?.dbUrl?.length >= 0) {
    mongoose.set("debug", false);
    mongoose.Promise = require("bluebird");
    mongoose.Promise = global.Promise;
    mongoose.connect(connection.dbUrl, {
      useNewUrlParser: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    });
    let db = mongoose.connection;
    db.once("open", function () {
      const url = new URL(connection?.dbUrl);
      // Extract the database name
      const dbName = url?.pathname?.replace(/^\//, "");

      prettyConsole.success("Db connnected on " + dbName);
    });
    db.on("error", function (err: any) {
      console.error(err);
    });
  }
};

module.exports = dbConnection;
