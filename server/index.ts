import express from "express";
import cors from "cors";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { ObjectId } from "mongoose";
import { Socket } from "socket.io";
const io = require("socket.io")(8080, {
  cors: {
    origin: "http://localhost:3000",
  },
});

require("./db/connection");
require("dotenv").config();
const app = express();

app.use(cors());
app.use(express.json());

const User = require("./db/models/User");
const Conversation = require("./db/models/Conversation");
const Messages = require("./db/models/Messages");
interface CustomSocket extends Socket {
  userId?: string;
}

/// socket io
let users: any[] = [];
io.on("connection", (socket: CustomSocket) => {
  console.log("user connected", socket.id);

  socket.on("addUser", (userId) => {
    const isUserExist = users.find((user) => user.userId === userId);

    if (!isUserExist) {
      const user = { userId, socketId: socket.id };
      users.push(user);
      io.emit("getUsers", users);
      socket.userId = userId;

      io.emit("getUser", socket.userId);
    }
  });
  socket.on(
    "sendMessage",
    async ({ senderId, reciverId, conversationId, message }) => {
      const reciver = users.find((user) => user.userId === reciverId);
      const sender = users.find((user) => user.userId === senderId);

      if (reciver) {
        io.to(reciver.socketId).to(sender.socketId).emit("getMessage", {
          senderId,
          message,
          conversationId,
          reciverId,
        });
      }
    }
  );

  socket.on("disconnect", () => {
    users = users.filter((user) => user.socketId !== socket.id);
  });
});

app.get("/", (req, res) => {
  res.send("hello");
});
// for registeration

app.post("/api/signup", async (req, res, next) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: "Please fill all required fields" });
    }

    const isAlreadyExist = await User.findOne({ email });

    if (isAlreadyExist) {
      return res.status(400).json({ error: "User already exists" });
    }

    const newUser = new User({
      username,
      email,
    });

    const hashPassword = await bcrypt.hash(password, 10);

    newUser.set("password", hashPassword);
    await newUser.save();

    return res.status(200).json(newUser);
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

// for login
app.post("/api/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).send("please fill all required fields");
    } else {
      const user = await User.findOne({ email });
      if (!user) {
        res.status(400).send("User does not exist");
      } else {
        const validateUser = await bcrypt.compare(password, user.password);

        if (!validateUser) {
          res.status(400).send("email or password is incorrect");
        } else {
          const payload = {
            userId: user._id,
            email: user.email,
          };
          const JWT_SECRET_KEY =
            process.env.JWT_SECRET_KEY || "THIS_IS_A_JWT_KEY";
          jwt.sign(
            payload,
            JWT_SECRET_KEY,
            { expiresIn: 86400 },
            async (err, token) => {
              await User.updateOne({ _id: user._id }, { $set: { token } });
              await user.save();
              return res.status(200).json({ user, token });
            }
          );
        }
      }
    }
  } catch (error) {
    console.log(error, "error");
  }
});

// for converstion
app.post("/api/conversation", async (req, res, next) => {
  try {
    const { senderId, reciverId } = req.body;
    const newConversation = new Conversation({
      members: [senderId, reciverId],
    });
    await newConversation.save();
    res.status(200).send("Conversation created succefulyy");
  } catch (error) {
    console.log(error);
  }
});
//  for coversation past chat
app.get("/api/conversation/:userId", async (req, res, next) => {
  try {
    const userid = req.params.userId;
    const conversation = await Conversation.find({
      members: { $in: [userid] },
    });
    interface ConversationDocument {
      _id: number;
      members: string[];
      __v: number;
    }

    const conversationDataPromises = conversation.map(
      async (data: ConversationDocument) => {
        // console.log("datta", data);
        const reciverId = data.members.find((member: String) => {
          return member !== userid;
        });

        const user = await User.findById(reciverId);

        return {
          user: {
            reciverId: user?._id,
            email: user?.email,
            username: user?.username,
          },
          conversationId: data?._id,
        };
      }
    );
    const conversationData = await Promise.all(conversationDataPromises);
    res.status(200).json(conversationData);
  } catch (error) {
    console.log(error);
  }
});
app.post("/api/message", async (req, res, next) => {
  try {
    const { conversationId, senderId, message, reciverId = "" } = req.body;
    if (!senderId || !message)
      return res.status(400).send("No sender id or no message");

    if (conversationId == "new" && reciverId) {
      const newConversation = new Conversation({
        members: [senderId, reciverId],
      });

      await newConversation.save();

      const newMessage = new Messages({
        conversationId: newConversation._id,
        senderId,
        message,
      });
      await newMessage.save();
    } else {
      const newMessage = new Messages({
        conversationId: conversationId,
        senderId,
        message,
      });
      await newMessage.save();
    }

    return res.status(200).send("Message successfully sent");
  } catch (error) {
    console.log(error);
    return res.status(500).send("Internal Server Error");
  }
});

app.get("/api/message/:conversationId", async (req, res, next) => {
  try {
    const conversationId = req.params.conversationId;
    if (conversationId === "new") {
      return res.status(200).json({});
    }

    const messages = await Messages.find({ conversationId });
    // console.log("messages", messages);

    interface ConversationDocument {
      senderId: number;
      message: string;
      __v: number;
    }
    const messageUserDataPromis = messages.map(
      async (message: ConversationDocument) => {
        const Sender = await User.findById(message.senderId);

        return {
          Sender: {
            senderId: Sender._id,
            username: Sender.username,
            email: Sender.email,
          },
          message: message.message,
        };
      }
    );
    const messageUserData = await Promise.all(messageUserDataPromis);
    // console.log("messageUserData ", messageUserData);
    res.status(200).json(messageUserData);
  } catch (error) {
    console.log(error);
  }
});

app.get("/api/users", async (req, res) => {
  interface UserModel {
    _id: string;
    email: string;
    username: string;
  }
  try {
    const users = await User.find();
    const usersDataPromise = users.map(async (user: UserModel) => {
      return {
        user: {
          reciverId: user._id,
          username: user.username,
          email: user.email,
        },
        userId: user._id,
      };
    });

    const usersData = await Promise.all(usersDataPromise);

    res.status(200).json(usersData);
  } catch (error) {
    console.log("Error", error);
  }
});

app.get("/api/checkuser/:currUser/:reciver", async (req, res) => {
  try {
    const currUser = req.params.currUser;
    const reciver = req.params.reciver;

    const user = await User.findById(currUser);
    const receiver = await User.findById(reciver);

    if (!user || !receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    const existingConversation = await Conversation.findOne({
      members: { $all: [currUser, reciver] },
    });
    // console.log("existingConversation", existingConversation);
    if (existingConversation) {
      return res.json({ conversationId: existingConversation._id });
    } else {
      const newConversation = new Conversation({
        members: [currUser, reciver],
      });

      const savedConversation = await newConversation.save();

      return res.json({ conversationId: savedConversation._id });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something is wrong" });
  }
});

//

app.listen(8000, () => {
  console.log(`Connected on port ${process.env.PORT}`);
});
