import mongoose from "mongoose";

const mongoURL =
  "mongodb+srv://tejas10122001:KnTwUVcmSqesG2J0@chat-cluster.qpuj1uw.mongodb.net/?retryWrites=true&w=majority";

mongoose
  .connect(mongoURL, {})
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error.message);
  });
