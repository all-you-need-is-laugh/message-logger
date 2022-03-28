import { RedisService } from '@liaoliaots/nestjs-redis';
import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { v4 as uuidV4 } from 'uuid';
import { Message } from '../entities/message.entity';

interface ListMessagesParams {
  fromTime?: number
  toTime?: number
  count?: number
  offset?: number
}

@Injectable()
export class MessageReceiverService {
  private readonly redis: Redis;

  static readonly MESSAGES_SET_NAME = 'ordered_messages';

  constructor (private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
  }

  private messageToRedisRecord (message: Message): string {
    return `${message.timestamp}:${uuidV4()}:${message.text}`;
  }

  private redisRecordToMessage (record: string): Message {
    const [ timestamp, _id, text ] = record.split(':');
    return new Message(parseInt(timestamp, 10), text);
  }

  async listMessages ({ fromTime = 0, toTime = Date.now(), count = 10, offset = 0 }: ListMessagesParams) {
    const records = await this.redis.zrange(
      MessageReceiverService.MESSAGES_SET_NAME,
      fromTime, toTime, 'BYSCORE', 'LIMIT', offset, count
    );

    return records.map(this.redisRecordToMessage);
  }

  async publishMessage (message: Message) {
    const result = await this.redis.zadd(
      MessageReceiverService.MESSAGES_SET_NAME,
      message.timestamp, this.messageToRedisRecord(message)
    );

    return !!result;
  }
}
