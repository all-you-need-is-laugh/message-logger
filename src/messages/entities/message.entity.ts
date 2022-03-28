import { v4 as uuidV4 } from 'uuid';

type MessageDto = Omit<Message, 'id'> & { id?: string }

export class Message {
  id: string;
  text: string;
  timestamp: number;

  constructor (timestamp: number, text: string, id: string = uuidV4()) {
    this.id = id;
    this.text = text;
    this.timestamp = timestamp;
  }

  static fromDto (dto: MessageDto) {
    return new this(dto.timestamp, dto.text, dto.id);
  }
}
