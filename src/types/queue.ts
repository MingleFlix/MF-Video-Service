export interface QueueItem {
  user: string;
  url: string;
  active: boolean;
}

export interface QueueEvent {
  room: string | null;
  event: string;
  items: Array<QueueItem>;
}
