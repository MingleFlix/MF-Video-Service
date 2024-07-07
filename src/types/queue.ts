/*
 * Author: Alexandre Kaul
 * Matrikelnummer: 2552912
 */

export interface QueueItem {
  /*
   * user: name
   * url: video url
   * active: video currently being played
   */
  user: string;
  url: string;
  active: boolean;
}

export interface QueueEvent {
  /*
   * room: room id
   * event: add-video | delete-video | sync-queue
   * items: QueueItem[0..*]
   */
  room: string | null;
  event: string;
  items: Array<QueueItem>;
}
