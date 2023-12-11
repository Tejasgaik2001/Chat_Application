const mongooseee = require("mongoose");

const messagesSchema = mongooseee.Schema({
  conversationId: {
    type: String,
  },
  senderId: {
    type: String,
  },
  message: {
    type: String,
  },
});
const Messages = mongooseee.model("Messages", messagesSchema);
module.exports = Messages;
