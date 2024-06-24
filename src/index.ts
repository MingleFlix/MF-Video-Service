import express from "express";
import WebSocket from "ws";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { authenticateJWT } from "./lib/authHelper";
import { Client } from "./types/client";
import { PlayerEvent } from "./types/events";
import { QueueEvent } from "./types/queue";

dotenv.config();

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
const subscriberClients: Array<Client> = [];
const queueItems: Array<QueueEvent> = [];

const sendEventToSubscriber = (
  clients: Array<Client>,
  event: PlayerEvent | QueueEvent,
  ws: WebSocket,
  message: string
) => {
  var connectionCount = 0;
  clients.forEach((client) => {
    // Don't send event to closed sockets
    if (client.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    // Only send event to clients in the same room
    if (client.room !== event.room) {
      return;
    }

    // Don't send event back to the sender except if the queue asked to sync
    if (client.socket === ws && event.event !== "sync-ack-queue") {
      return;
    }

    // Only send add-video events to the queue and not the player
    if (event.event === "add-video" && client.type !== "queue") {
      return;
    }

    client.socket.send(message);
    connectionCount += 1;
  });

  console.log(
    `Broadcasted ${message} to ${connectionCount} connection(s) in room ${event.room}.`
  );
};

wss.on("connection", async (ws, req) => {
  console.log("New WebSocket connection");

  // Parse Url
  const params = new URLSearchParams(req.url?.substring(1));
  const roomID = params.get("roomID");
  const token = params.get("token");
  const type = params.get("type");

  // console.log("WebSocket Room:", roomID);
  // console.log("WebSocket Token:", token);

  if (!token) {
    console.error("No token provided!");
    ws.close();
    return;
  }

  // Authenticate user via JWT
  let user: any;
  try {
    user = authenticateJWT(token);
  } catch (error) {
    console.error("Error authenticating user:", error);
  }

  // Close connection if user room id is missing or user not found
  if (!user || !roomID) {
    ws.close();
    return;
  }

  console.log("Client connected to room", roomID, "with type", type);

  // Add player client to the list, in order to broadcast events to all player clients
  if (type !== "input") {
    subscriberClients.push({ room: roomID, type: type, socket: ws });
  }

  ws.on("message", async (message) => {
    const event = JSON.parse(message as any) as PlayerEvent;

    if (event.event === "sync-queue") {
      let queue: QueueEvent = {
        room: event.room,
        event: "sync-ack-queue",
        items: [],
      };

      queueItems.forEach((item) => {
        if (item.room === event.room) {
          queue = item;
        }
      });

      sendEventToSubscriber(
        subscriberClients,
        queue,
        ws,
        JSON.stringify(queue)
      );
      return;
    }

    if (event.event === "add-video") {
      let queue: QueueEvent = {
        room: event.room,
        event: "add-video",
        items: [{ user: event.user, url: event.url as string, active: false }],
      };

      let exists: boolean = false;
      queueItems.forEach((item) => {
        if (item.room === event.room) {
          item.items?.push({
            user: event.user,
            url: event.url as string,
            active: false,
          });

          queue = item;
          exists = true;
        }
      });

      if (!exists) {
        queueItems.push(queue);
      }

      sendEventToSubscriber(
        subscriberClients,
        queue,
        ws,
        JSON.stringify(queue)
      );
      return;
    }

    if (event.event === "play-video") {
      let queue: QueueEvent = {
        room: event.room,
        event: "play-video",
        items: [{ user: event.user, url: event.url as string, active: false }],
      };

      queueItems.forEach((item) => {
        if (item.room === event.room) {
          item.items?.forEach((qItem) => {
            if (qItem.url === event.url) {
              qItem.active = true;
            } else {
              qItem.active = false;
            }
          });

          queue = item;
        }
      });

      sendEventToSubscriber(
        subscriberClients,
        queue,
        ws,
        JSON.stringify(queue)
      );
    }

    sendEventToSubscriber(subscriberClients, event, ws, message.toString());
  });

  ws.on("close", () => {
    console.log("Closed websocket");
  });
});
