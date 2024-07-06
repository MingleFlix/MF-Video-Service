import express from "express";
import WebSocket from "ws";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { createClient } from "redis";
import { authenticateJWT } from "./lib/authHelper";
import { Client } from "./types/client";
import { PlayerEvent } from "./types/events";
import { QueueEvent } from "./types/queue";

dotenv.config();

const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const VALID_TYPES = ["player", "queue", "input"];
const QUEUE_ALLOWED_EVENTS = ["add-video", "sync-ack-queue", "delete-video"];
const PLAYER_ALLOWED_EVENTS = [
  "sync",
  "sync-ack-play",
  "sync-ack-pause",
  "re-sync",
  "play-video",
  "play",
  "pause",
];

const app = express();
const port = process.env.PORT || 3002;

// Middleware
app.use(cookieParser());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Video Sync Service");
});

const server = app.listen(port, () => {
  console.log(`Video Sync Service is running on http://localhost:${port}`);
});

// Redis Client
let redisClient: any;
let redisConnected = false;

(async () => {
  try {
    redisClient = createClient({ url: `redis://${REDIS_HOST}:6379` });
    await redisClient.connect();
    redisConnected = true;
    console.log("Connected to Redis");
  } catch (error) {
    console.error("Failed to connect to Redis, using in-memory storage");
  }
})();

// Websocket server
const wss = new WebSocket.Server({ server: server });

// In-memory storage (consider moving to a persistent store like Redis)
const subscriberClients: Client[] = [];
const queueItems: QueueEvent[] = [];

// Function to send events to subscribers
const sendEventToSubscriber = (
  clients: Client[],
  event: PlayerEvent | QueueEvent,
  ws: WebSocket,
  message: string
) => {
  let connectionCount = 0;

  clients.forEach((client) => {
    if (client.socket.readyState !== WebSocket.OPEN) return;
    if (client.room !== event.room) return;
    // Don't send event back to the sender except if the queue asked to sync
    if (client.socket === ws && event.event !== "sync-ack-queue") return;
    // Only send events to queue if allowed
    if (client.type === "queue" && !QUEUE_ALLOWED_EVENTS.includes(event.event))
      return;
    // Only send events to player if allowed
    if (
      client.type === "player" &&
      !PLAYER_ALLOWED_EVENTS.includes(event.event)
    )
      return;

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

  if (!token) {
    console.error("No token provided!");
    ws.close();
    return;
  }

  if (!type || !VALID_TYPES.includes(type)) {
    console.error("Type not allowed!");
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

    switch (event.event) {
      case "sync-queue":
        handleSyncQueueEvent(event, ws);
        break;
      case "add-video":
        handleAddVideoEvent(event, ws);
        break;
      case "play-video":
        handlePlayVideoEvent(event, ws);
        break;
      case "delete-video":
        handleDeleteVideoEvent(event, ws);
        break;
      default:
        sendEventToSubscriber(subscriberClients, event, ws, message.toString());
    }
  });

  ws.on("close", () => {
    console.log("Closed websocket");
  });

  // Send ping messages every 30 seconds (keep the connection alive)
  const pingInterval = setInterval(() => {
    if (ws.readyState === ws.OPEN) {
      ws.ping();
    } else {
      clearInterval(pingInterval);
    }
  }, 30000);

  ws.on("pong", () => {
    console.log("Pong received");
  });
});

// Event Handlers
const handleSyncQueueEvent = async (event: PlayerEvent, ws: WebSocket) => {
  let queue = (await getQueueForRoom(event.room)) || {
    room: event.room,
    event: "sync-ack-queue",
    items: [],
  };
  sendEventToSubscriber(subscriberClients, queue, ws, JSON.stringify(queue));
};

const handleAddVideoEvent = async (event: PlayerEvent, ws: WebSocket) => {
  let queue = (await getQueueForRoom(event.room)) || {
    room: event.room,
    event: "add-video",
    items: [],
  };
  queue.items.push({
    user: event.user,
    url: event.url as string,
    active: false,
  });
  await updateQueueForRoom(queue);
  sendEventToSubscriber(subscriberClients, queue, ws, JSON.stringify(queue));
};

const handlePlayVideoEvent = async (event: PlayerEvent, ws: WebSocket) => {
  let queue = await getQueueForRoom(event.room);
  if (queue) {
    queue.items.forEach((item) => {
      item.active = item.url === event.url;
    });
    queue.event = "sync-ack-queue";
    await updateQueueForRoom(queue);
    sendEventToSubscriber(subscriberClients, queue, ws, JSON.stringify(queue));

    const playerEvent: PlayerEvent = {
      room: event.room,
      event: "play-video",
      user: event.user,
      time: "0",
      url: event.url,
    };
    sendEventToSubscriber(
      subscriberClients,
      playerEvent,
      ws,
      JSON.stringify(playerEvent)
    );
  }
};

const handleDeleteVideoEvent = async (event: PlayerEvent, ws: WebSocket) => {
  console.log("handleDeleteVideoEvent()");
  let queue = await getQueueForRoom(event.room);
  if (queue) {
    queue.items = queue.items.filter((item) => item.url !== event.url);
    queue.event = "sync-ack-queue";
    await updateQueueForRoom(queue);
    sendEventToSubscriber(subscriberClients, queue, ws, JSON.stringify(queue));
  }
};

const updateQueueForRoom = async (queue: QueueEvent) => {
  if (redisConnected) {
    try {
      await redisClient.set(`queue:${queue.room}`, JSON.stringify(queue));
    } catch (error) {
      console.error("Error updating queue in Redis:", error);
    }
  } else {
    const index = queueItems.findIndex((item) => item.room === queue.room);
    if (index !== -1) {
      queueItems[index] = queue;
    } else {
      queueItems.push(queue);
    }
  }
};

// Helper functions
const getQueueForRoom = async (
  room: string
): Promise<QueueEvent | undefined> => {
  if (redisConnected) {
    try {
      const queue = await redisClient.get(`queue:${room}`);
      return queue ? JSON.parse(queue) : undefined;
    } catch (error) {
      console.error("Error fetching queue from Redis:", error);
      return undefined;
    }
  } else {
    return queueItems.find((queue) => queue.room === room);
  }
};

export default server;
