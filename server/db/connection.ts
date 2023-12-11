const mongoose = require("mongoose");
require("dotenv").config();

const mongoURL = process.env.MONGO_URL;

if (!mongoURL) {
  console.error("MONGO_URL not defined in the environment variables.");
  process.exit(1); // Exit the process with an error code
}

mongoose
  .connect(mongoURL, {})
  .then(() => {
    console.log("Connected to the database successfully");
  })
  .catch((err: Error) => {
    console.error("Error connecting to the database:", err);
  });
