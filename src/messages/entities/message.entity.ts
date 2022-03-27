export class Message {
  text: string;
  timestamp: number;

  constructor (timestamp: number, text: string) {
    this.text = text;
    this.timestamp = timestamp;
  }
}
