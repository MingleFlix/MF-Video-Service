import express from "express";
import WebSocket from "ws";
import cookieParser from "cookie-parser";
import { authenticateJWT } from "./lib/authHelper";
import { Client } from "./types/client";
import { PlayerEvent } from "./types/events";

const app = express();
const port = process.env.PORT || 3002;

// Use cookie parser
app.use(cookieParser());

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Video Sync Service");
});

const server = app.listen(port, () => {
  console.log(`Video Sync Service is running on http://localhost:${port}`);
});

// Websocket server
const wss = new WebSocket.Server({ server: server });

// To-Do: Store inside redis
const clients: Array<Client> = [];

wss.on("connection", async (ws, req) => {
  console.log("New WebSocket connection");

  // Parse Url
  const params = new URLSearchParams(req.url?.substring(1));
  const roomID = params.get("roomID");
  const token = params.get("token");
  const type = params.get("type");

  console.log("WebSocket Room:", roomID);
  console.log("WebSocket Token:", token);

  // Authenticate user via JWT
  //   let user: any;
  //   try {
  //     user = authenticateJWT(token || "");
  //   } catch (error) {
  //     console.error("Error authenticating user:", error);
  //   }

  //   // Close connection if user room id is missing or user not found
  //   if (!user || !roomID) {
  //     ws.close();
  //     return;
  //   }

  // Add client to the list, in order to broadcast events to all clients
  console.log("Type:", type);
  if (type === "player") {
    clients.push({ room: roomID, socket: ws });
  }

  ws.on("message", async (message) => {
    const event = JSON.parse(message as any) as PlayerEvent;

    console.log("Room id:", event.room);

    var connectionCount = 0;
    clients.forEach((client) => {
      if (
        client.room === event.room &&
        client.socket.readyState === WebSocket.OPEN &&
        client.socket != ws
      ) {
        client.socket.send(message.toString());
        connectionCount += 1;
      }
    });

    console.log(
      `Broadcasted ${message} to ${connectionCount} connection(s) in room ${event.room}.`
    );
  });

  ws.on("close", () => {
    console.log("Closed websocket");
  });
});
