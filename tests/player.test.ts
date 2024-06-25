import WebSocket from "ws";
import dotenv from "dotenv";
import app from "../src/index";
import generateUserToken from "./helper/auth";

dotenv.config();

const ROOM_ID = "queuetest";
const USER_TOKEN = generateUserToken();

afterAll(() => {
  app.close();
});

describe("WebSocket Player", () => {
  let wsPlayerSender: WebSocket;
  let wsPlayerSubscriber: WebSocket;

  // Init Player Sender WebSocket
  beforeEach((done) => {
    // Queue
    wsPlayerSender = new WebSocket(
      `ws://localhost:${process.env.PORT}?roomID=${ROOM_ID}&type=player&token=${USER_TOKEN}`
    );

    wsPlayerSender.on("open", () => {
      done();
    });

    wsPlayerSender.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  // Init Player Subscriber WebSocket
  beforeEach((done) => {
    // Input
    wsPlayerSubscriber = new WebSocket(
      `ws://localhost:${process.env.PORT}?roomID=${ROOM_ID}&type=player&token=${USER_TOKEN}`
    );

    wsPlayerSubscriber.on("open", () => {
      done();
    });

    wsPlayerSubscriber.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  // Cleanup
  afterEach(() => {
    if (wsPlayerSender.readyState === WebSocket.OPEN) {
      wsPlayerSender.close();
    }
    if (wsPlayerSubscriber.readyState === WebSocket.OPEN) {
      wsPlayerSubscriber.close();
    }
  });

  it("should handle play request", (done) => {
    const URL = "https://some-random-url.tld/video.mp4";
    const USER = "foo";
    const EVENT = {
      room: ROOM_ID,
      event: "play",
      user: USER,
      time: 50,
      url: URL,
    };

    wsPlayerSubscriber.on("message", (message) => {
      const event = JSON.parse(message.toString());
      expect(event).toEqual(EVENT);
      done();
    });

    wsPlayerSubscriber.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });

    wsPlayerSender.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });

    wsPlayerSender.send(JSON.stringify(EVENT));
  });

  it("should handle pause request", (done) => {
    const URL = "https://some-random-url.tld/video.mp4";
    const USER = "foo";
    const EVENT = {
      room: ROOM_ID,
      event: "pause",
      user: USER,
      time: 30,
      url: URL,
    };

    wsPlayerSubscriber.on("message", (message) => {
      const event = JSON.parse(message.toString());
      expect(event).toEqual(EVENT);
      done();
    });

    wsPlayerSubscriber.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });

    wsPlayerSender.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });

    wsPlayerSender.send(JSON.stringify(EVENT));
  });
});
