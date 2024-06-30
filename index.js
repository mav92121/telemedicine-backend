import express from "express";
import { Server } from "socket.io";
import { createServer } from "http";
import mongoose from "mongoose";
import Document from "./Document.js";
import dotenv from "dotenv";
import cors from "cors";

const app = express();
dotenv.config();
const server = createServer(app);
const CONNECTION_URL = process.env.CONNECTION_URL;
const PORT = process.env.PORT || 3000;
app.use(
  cors({
    credentials: true,
    origin:
      "https://6681a7d59fbda3647da0c8dd--meek-profiterole-6b3c13.netlify.app",
    // origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
mongoose
  .connect(CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("connected to db"));
app.get("/hello-world", (req, res) => {
  res.send("Hello World!");
});
const io = new Server(server, {
  cors: {
    credentials: true,
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

const defaultData = "";

const findOrCreateDocument = async (id) => {
  if (id == null) return;
  const document = await Document.findById(id);
  if (document) return document;
  return await Document.create({ _id: id, data: defaultData });
};

io.on("connection", (socket) => {
  socket.on("get-document", async (documentId) => {
    const document = await findOrCreateDocument(documentId);
    socket.join(documentId);
    socket.emit("load-document", document.data);
    socket.on("send-changes", (delta) => {
      socket.broadcast.to(documentId).emit("receive-changes", delta);
    });
    socket.on("save-document", async (data) => {
      await Document.findByIdAndUpdate(documentId, { data });
    });
  });
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`listening on port ${PORT}`);
});
