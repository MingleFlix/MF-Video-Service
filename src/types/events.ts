/*
 * Author: Alexandre Kaul
 * Matrikelnummer: 2552912
 */

export interface PlayerEvent {
  /*
   * room: room id
   * event:
   *    play | pause | sync |
   *    sync-ack-play | sync-ack-pause |
   *    re-sync | play-video
   * user: name
   * time: video current time
   * url: video url
   */
  room: string;
  event: string;
  user: string;
  time: string | null;
  url: string | null;
}
