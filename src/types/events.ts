export interface PlayerEvent {
  /*
   * room: room id
   * event: play | pause | seeked
   * user: name
   * time: video current time
   * url: video url
   * sync: client sync request
   */
  room: string;
  event: string;
  user: string;
  time: string | null;
  url: string | null;
}
