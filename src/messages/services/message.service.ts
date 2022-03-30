import { InjectRedis } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { Message } from '../entities/message.entity';

interface ListMessagesParams {
  fromTime?: number
  toTime?: number
  count?: number
  offset?: number
}

@Injectable()
export class MessageService {
  static readonly MESSAGES_SET_NAME = 'ordered_messages';

  constructor (
    @InjectRedis() private readonly redis: Redis
  ) {}

  private messageToRedisRecord (message: Message): string {
    return `${message.timestamp}:${message.id}:${message.text}`;
  }

  private redisRecordToMessage (record: string): Message {
    const [ timestamp, id, text ] = record.split(':');
    return new Message(parseInt(timestamp, 10), text, id);
  }

  async listMessages ({ fromTime = 0, toTime = Date.now(), count = 10, offset = 0 }: ListMessagesParams = {}) {
    const records = await this.redis.zrange(
      MessageService.MESSAGES_SET_NAME,
      fromTime, toTime, 'BYSCORE', 'LIMIT', offset, count
    );

    return records.map(this.redisRecordToMessage);
  }

  async publishMessage (message: Message) {
    const result = await this.redis.zadd(
      MessageService.MESSAGES_SET_NAME,
      message.timestamp, this.messageToRedisRecord(message)
    );

    return !!result;
  }

  async remove (message: Message) {
    const result = await this.redis.zrem(MessageService.MESSAGES_SET_NAME, this.messageToRedisRecord(message));

    return !!result;
  }
}
