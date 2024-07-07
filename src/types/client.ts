/*
 * Author: Alexandre Kaul
 * Matrikelnummer: 2552912
 */

export interface Client {
  /*
   * room: room id
   * type: player | queue | input
   * socket: WebSocket
   */
  room: string;
  type: string | null;
  socket: WebSocket | any;
}
