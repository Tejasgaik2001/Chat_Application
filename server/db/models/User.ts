const mongooseeee = require("mongoose");

const userSchema = mongooseeee.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  token: {
    type: String,
  },
});
const User = mongooseeee.model("User", userSchema);
module.exports = User;
