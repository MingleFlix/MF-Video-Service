export interface Client {
  room: string | null;
  socket: WebSocket | any;
}
