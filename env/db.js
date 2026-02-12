const mongoose = require("mongoose");

const connectDB = () => {
  mongoose
    .connect("mongodb://localhost:27017/saryudb")
    .then(() => {
      console.log("Database connection successfull!");
    })
    .catch((error) => {
      console.log("Database connection failed!", error);
      console.log("Attempting to reconnect...")
      setTimeout(() => {
        connectDB();
      }, 2000); 
    });
};

module.exports = connectDB;