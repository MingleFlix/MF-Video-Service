import WebSocket from "ws";
import dotenv from "dotenv";
import app from "../src/index";
import generateUserToken from "./helper/auth";

dotenv.config();

const ROOM_ID = "queuetest";
const USER_TOKEN = generateUserToken();

afterAll((done) => {
  app.close();
  done();
});

describe("WebSocket Queue", () => {
  let wsQueue: WebSocket;
  let wsInput: WebSocket;
  let wsPlayer: WebSocket;

  // Init Queue WebSocket
  beforeEach((done) => {
    // Queue
    wsQueue = new WebSocket(
      `ws://localhost:${process.env.PORT}?roomID=${ROOM_ID}&type=queue&token=${USER_TOKEN}`
    );

    wsQueue.on("open", () => {
      done();
    });

    wsQueue.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  // Init Input WebSocket
  beforeEach((done) => {
    // Input
    wsInput = new WebSocket(
      `ws://localhost:${process.env.PORT}?roomID=${ROOM_ID}&type=input&token=${USER_TOKEN}`
    );

    wsInput.on("open", () => {
      done();
    });

    wsInput.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  // Init Player WebSocket
  beforeEach((done) => {
    // Input
    wsPlayer = new WebSocket(
      `ws://localhost:${process.env.PORT}?roomID=${ROOM_ID}&type=player&token=${USER_TOKEN}`
    );

    wsPlayer.on("open", () => {
      done();
    });

    wsPlayer.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  afterEach(() => {
    if (wsPlayer.readyState === WebSocket.OPEN) {
      wsPlayer.close();
    }
    if (wsQueue.readyState === WebSocket.OPEN) {
      wsQueue.close();
    }
    if (wsInput.readyState === WebSocket.OPEN) {
      wsInput.close();
    }
  });

  it("should handle sync-queue request with empty queue", (done) => {
    wsQueue.send(
      JSON.stringify({
        room: ROOM_ID,
        event: "sync-queue",
        user: "foo",
        time: 0,
        url: null,
      })
    );

    wsQueue.on("message", (message) => {
      const event = JSON.parse(message.toString());
      expect(event.event).toEqual("sync-ack-queue");
      expect(event.items).toEqual([]);
      done();
    });

    wsQueue.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  it("should handle add-video request", (done) => {
    const URL = "https://some-random-url.tld/video.mp4";
    const USER = "foo";

    wsInput.send(
      JSON.stringify({
        room: ROOM_ID,
        event: "add-video",
        user: "foo",
        time: 0,
        url: URL,
      })
    );

    wsQueue.on("message", (message) => {
      const event = JSON.parse(message.toString());
      expect(event.event).toEqual("add-video");
      expect(event.items).toEqual([{ active: false, url: URL, user: USER }]);
      done();
    });

    wsQueue.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  it("should handle delete-video request", (done) => {
    const URL = "https://some-random-url.tld/video.mp4";
    const USER = "foo";

    wsInput.send(
      JSON.stringify({
        room: ROOM_ID,
        event: "add-video",
        user: USER,
        time: 0,
        url: URL,
      })
    );

    wsQueue.on("message", (message) => {
      const event = JSON.parse(message.toString());
      if (event.event == "add-video") {
        // Now we want to delete it again
        wsQueue.send(
          JSON.stringify({
            room: ROOM_ID,
            event: "delete-video",
            user: USER,
            time: 0,
            url: URL,
          })
        );

        return;
      }

      expect(event.event).toEqual("sync-ack-queue");
      expect(event.items).toEqual([]);
      done();
    });

    wsQueue.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });
  });

  it("should handle play-video request", (done) => {
    const URL = "https://some-random-url.tld/video.mp4";
    const USER = "foo";

    wsQueue.on("message", (message) => {
      const event = JSON.parse(message.toString());
      console.log("Received", event.event);
      if (event.event == "sync-ack-queue") {
        // Now we want to delete it again
        wsQueue.send(
          JSON.stringify({
            room: ROOM_ID,
            event: "play-video",
            user: USER,
            time: 0,
            url: URL,
          })
        );

        return;
      }
    });

    wsPlayer.on("message", (message) => {
      const event = JSON.parse(message.toString());

      expect(event.event).toEqual("play-video");
      expect(event.url).toEqual(URL);
      done();
    });

    wsQueue.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });

    wsPlayer.on("error", (error) => {
      console.error("WebSocket error:", error);
      done(error); // Fail the test if there's an error
    });

    wsInput.send(
      JSON.stringify({
        room: ROOM_ID,
        event: "add-video",
        user: USER,
        time: 0,
        url: URL,
      })
    );
  });
});
