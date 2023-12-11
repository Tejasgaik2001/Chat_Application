const mongoose = require("mongoose");
require("dotenv").config();

const mongoURL =
  "mongodb+srv://tejas10122001:KnTwUVcmSqesG2J0@chat-cluster.qpuj1uw.mongodb.net/?retryWrites=true&w=majority";

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
