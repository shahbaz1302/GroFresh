import express from "express";
import "dotenv/config";
import http from "http";
import { Server } from "socket.io";
import axios from "axios";

const port = process.env.PORT || 8000;

const app = express();
app.use(express.json());
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: process.env.NEXT_BASE_URL, methods: ["GET", "POST"] },
});

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
  });

  socket.on("user_online", async (id) => {
    await axios.post(`${process.env.NEXT_BASE_URL}/api/socket/connect`, {
      userId: id,
      socketId: socket.id,
    });
  });

  socket.on("update_location", async ({ userId, latitude, longitude }) => {
    const location = { type: "Point", coordinates: [longitude, latitude] };
    await axios
      .post(`${process.env.NEXT_BASE_URL}/api/socket/update-location`, {
        userId,
        location,
      })
      .catch((error) => {
        console.error(
          "Error updating location:",
          error.response?.data || error.message,
        );
      });
    io.emit("update-deliveryBoy-location", { userId, location });
  });

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log("join room with", roomId);
  });

  socket.on("send-message", async (message) => {
    await axios.post(`${process.env.NEXT_BASE_URL}/api/chat/save`, message);
    io.to(message.roomId).emit("send-message", message);
  });
});

app.post("/notify", (req, res) => {
  const { event, data, socketId } = req.body;
  if (socketId) {
    console.log(`[notify] Emitting "${event}" to socket: ${socketId}`);
    io.to(socketId).emit(event, data);
  } else {
    console.log(`[notify] Broadcasting "${event}" to all clients`);
    io.emit(event, data);
  }
  return res.status(200).json({ success: true });
});

server.listen(port, () => {
  console.log("Socket server running on port", port);
});
