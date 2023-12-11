import React, { useEffect, useRef, useState, RefObject } from "react";
import userIcon from "../../img/user.png";
import sendIcon from "../../img/sendIcon.png";
import circlePlus from "../../img/circle-plus.png";
import io, { Socket } from "socket.io-client";

function DashBoard() {
  interface UserType {
    _id: string;
    username: string;
    email: string;
    password: string;
    __v: number;
    token: string;
  } //right
  interface ConversationItem {
    user: {
      email: string;
      username: string;
      reciverId: string;
    };
    conversationId: string;
  } // right fot when i click to get oppsit user
  interface UsersInFetch {
    user: {
      reciverId: string;
      email: string;
      username: string;
    };
    userId: string;
  } /// its is use only fro fetching user
  interface OppositeUserInFetch {
    reciverId: string;
    email: string;
    username: string;
  } /// right in fetch message only requird this
  interface checkMessgaUser {
    userId: string;
    email: string;
    username: string;
  }
  const messageRef: RefObject<HTMLDivElement> = useRef(null);
  const storedUser = sessionStorage.getItem("user:detail");
  const parsedUser: UserType | null = storedUser
    ? JSON.parse(storedUser)
    : null;

  /// for sockte
  const [socket, setsocket] = useState<Socket | null>(null);

  useEffect(() => {
    setsocket(io("http://localhost:8080"));
  }, []);
  useEffect(() => {
    socket?.emit("addUser", user?._id);
    socket?.on("getUsers", (activeUsers) => {
      console.log("active users", activeUsers);
    });
    socket?.on("getMessage", (data) => {
      console.log("data>", data);
      if (data?.senderId === user?._id) {
      }
      setMessages((prevMessages) => ({
        ...prevMessages,
        message: [
          ...(prevMessages.message || []), // Check if prevMessages.message is defined
          {
            Sender: {
              senderId: data?.senderId || "", // Add a null/undefined check here
              username: data?.username || "",
              email: data?.email || "",
            },
            message: data?.message || "",
          },
        ],
        conversationId: data?.conversationId || null,
      }));
    });
  }, [socket]);

  // loggedin User
  const [user, setUser] = useState<UserType | null>(parsedUser);

  // storing  the all the users withe the curret uses had conversation here
  const [covsersation, setConversation] = useState([]);

  //  stroing all the user
  const [users, setUsers] = useState([]);
  // for fectching the user list with whom we have conversation
  useEffect(() => {
    const fetchConversation = async () => {
      const userId = parsedUser; // cureen user
      const res = await fetch(
        `http://localhost:8000/api/conversation/${userId?._id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const resData = await res.json();
      console.log("covseration data", resData);
      setConversation(resData);
    };
    fetchConversation();
  }, []);

  //
  useEffect(() => {
    if (user) {
      socket?.connect();
      socket?.emit("addUser", user?._id);
    }
  }, [user]);
  //for users list new people
  const fecthUsers = async () => {
    const res = await fetch(`http://localhost:8000/api/users`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const userData = await res.json();
    const realData = userData.filter(
      (userr: any) => user?._id !== userr.userId
    );
    console.log("reallldata", realData);
    setUsers(realData);
  };
  useEffect(() => {
    fecthUsers();
  }, []);

  console.log("current user", user);

  // stroing the all messages with that  friend
  const [messages, setMessages] = useState<{
    oppositeUser: OppositeUserInFetch | null;
    message: any[];

    conversationId: string | null;
  }>({
    oppositeUser: null,
    message: [],

    conversationId: null,
  });
  // for refering the last messages
  // useEffect(() => {
  //   (messageRef.current as HTMLElement)?.scrollIntoView({ behavior: "smooth" });
  // }, [messages?.message]);
  const fetchMessages = async (
    user: OppositeUserInFetch,
    conversationId: string
  ) => {
    const res = await fetch(
      `http://localhost:8000/api/message/${conversationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const responData = await res.json();

    console.log("opposite user", user);
    console.log("responDataa mess", responData);

    setMessages({
      oppositeUser: {
        reciverId: user.reciverId,
        email: user.email,
        username: user.username,
      },
      message: responData,

      conversationId: conversationId,
    });
  };

  //storing type message
  const [typedMessage, setTypedMessage] = useState<string | number>("");

  const sendMessage = async (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => {
    const currMessage = typedMessage;

    socket?.emit("sendMessage", {
      senderId: user?._id,
      reciverId: messages.oppositeUser?.reciverId,
      message: currMessage,
      conversationId: messages.conversationId,
    });

    const res = await fetch("http://localhost:8000/api/message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        conversationId: messages.conversationId,
        senderId: user?._id,
        message: typedMessage,
        reciverId: messages?.oppositeUser?.reciverId,
      }),
    });

    setTypedMessage("");
  };
  // to check if it has coversation or not
  const checkuserhasConvo = async (user: OppositeUserInFetch) => {
    const reciver = user.reciverId;
    const currUser = parsedUser?._id;
    const res = await fetch(
      `http://localhost:8000/api/checkuser/${currUser}/${reciver}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    const conoversitonid = await res.json();
    const conversationId = conoversitonid.conversationId;
    console.log("checkuser", conversationId);

    fetchMessages(user, conversationId);

    // if covnoc zlae asssssle tar  call fetch meassages (user,conoversitonid)

    //if not then   create convo() and fetch meeasage
  };

  return (
    <div className="bg-primary h-screen flex p-0 m-0  w-screen overflow-hidden">
      {/* left screen */}
      <div className="w-[25%] h-screen bg-[#f3f5ffdd]">
        <div className="flex justify-center items-center my-8 mx-14 ">
          <img
            src={userIcon}
            className="w-[50px] h-[50px] border border-blue-500
          rounded-full p-[2px]"
          />
          <div className=" ml-[10px]">
            <h3 className="text-2xl">{user?.username}</h3>
            <p className="text-lg font-light">My Account</p>
          </div>
        </div>
        <hr />

        <div className="ml-14 mt-10">
          <div className="text-[#1476ff] text-lg">Messages</div>
          <div className=" min-h-screen overflow-scroll">
            {covsersation.length > 0 ? (
              covsersation.map(
                ({ user, conversationId }: ConversationItem, index: number) => {
                  return (
                    <div className="flex  items-center   py-8 border-b border-gray-300">
                      <div
                        className="cursor-pointer flex items-center"
                        onClick={() => fetchMessages(user, conversationId)}
                      >
                        <img
                          src={userIcon}
                          className="w-[40px] h-[40px] border border-[#1476ff]
                        rounded-full p-[2px]"
                        />
                        <div className=" ml-[10px]">
                          <h3 className="text-lg font-semibold">
                            {user.username}
                          </h3>
                          <p className="text-sm font-light text-gray-600">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              )
            ) : (
              <div className="text-center text-lg font-semibold mt-24">
                No conversation
              </div>
            )}
          </div>
        </div>
      </div>
      {/* chat screen */}
      <div className="w-[50%] h-screen  flex flex-col items-center ">
        {messages?.oppositeUser?.username ? (
          <div className="w-[75%] h-[80px] bg-[#f3f5ff]  my-6 rounded-full flex items-center py-2 px-14  ">
            <div className=" cursor-pointer items-center">
              <img src={userIcon} className="w-[60px] h-[60px] ml-6" />
            </div>
            <div className=" flex flex-col  justify-center items-center">
              <h3 className="text-lg font-semibold ml-5">
                {messages?.oppositeUser?.username}
              </h3>
              <p className=" ml-5 text-sm font-light text-gray-600">online</p>
            </div>
          </div>
        ) : (
          ""
        )}

        <div className="h-[75%]   w-full overflow-scroll overflow-x-hidden   shadow-sm">
          {messages.message?.length > 0 ? (
            messages.message?.map(({ message, Sender }) => {
              const senderId = Sender?.senderId || "";
              if (senderId === user?._id) {
                return (
                  <>
                    <div className="p-4 max-w-[40%] bg-blue-800 rounded-b-xl rounded-tl-xl ml-auto text-white mb-4 mr-5 ">
                      {message}
                    </div>
                  </>
                );
              } else {
                return (
                  <>
                    <div className="p-4 max-w-[40%] bg-gray-300 rounded-b-xl rounded-tr-xl  text-black mb-4 ml-5">
                      {message}
                    </div>
                  </>
                );
              }
            })
          ) : (
            <div className="text-center text-lg font-semibold mt-24">
              No Messages
            </div>
          )}
        </div>
        {messages?.oppositeUser?.username && (
          <div className="p-14 w-full flex items-center">
            <input
              type="text"
              placeholder="Type a message..."
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="w-[79%] p-4 border-1 border-black rounded-full bg-light focus:ring-0 focus:border-0 outline-none shadow-lg placeholder-text-gray-900"
            />

            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !messages && "pointer-events-none"
              }`}
              onClick={(e) => sendMessage(e)}
            >
              <img
                src={sendIcon}
                className="w-[30px] h-[30px] mx-[8px] cursor-pointer ml-10"
              />
            </div>
            <div
              className={`ml-4 p-2 cursor-pointer bg-light rounded-full ${
                !messages && "pointer-events-none"
              }`}
            ></div>
          </div>
        )}
      </div>

      {/* right screen */}
      <div className="w-[25%] h-screen bg-light px-8 py-16 overflow-scroll ">
        <div className="text-[#1476ff] text-lg">People</div>
        <div>
          {users.length > 0 ? (
            users.map(({ user, userId }: UsersInFetch) => {
              return (
                <div className="flex items-center py-8 border-b border-b-gray-300">
                  <div
                    className="cursor-pointer flex items-center"
                    onClick={() => checkuserhasConvo(user)}
                  >
                    <img
                      src={userIcon}
                      className="w-[40px] h-[40px] border border-blue-500
                        rounded-full p-[2px]"
                    />
                    <div className=" ml-6">
                      <h3 className="ttext-lg font-semibold">
                        {user.username}
                      </h3>
                      <p className="text-sm font-light text-gray-600">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center font-semibold">No other user </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashBoard;
