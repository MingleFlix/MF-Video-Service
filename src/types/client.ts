export interface Client {
  room: string | null;
  type: string | null;
  socket: WebSocket | any;
}
