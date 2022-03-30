import { RedisModule } from '@liaoliaots/nestjs-redis';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../../app.module';
import { CommonModule } from '../../common/common.module';
import { ResponsePayload } from '../../common/entities/response-payload.entity';
import { MessagesModule } from '../messages.module';

const stringifyQuery = (params: Record<string, string>): string => {
  return new URLSearchParams(params).toString();
};

describe('MessageReceiverController (e2e)', () => {
  let app: INestApplication;
  let server;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        // TODO: read test config from service
        RedisModule.forRoot({
          config: {
            host: 'localhost',
            port: 6379,
            db: 2
          }
        }),
        CommonModule,
        MessagesModule.register({ skipRoutines: true })
      ],
    }).compile();

    app = moduleRef.createNestApplication();

    AppModule.bootstrap(app);

    await app.init();

    server = app.getHttpServer();
  });

  afterAll(async () => {
    await app?.close();
  });

  describe('[GET] /printMeAt', () => {

    it('return 201 for successful response', async () => {
      const query = {
        text: 'Hello, world!',
        timestamp: Date.now().toString(),
      };
      const { body, status } = await request(server).get(`/printMeAt?${stringifyQuery(query)}`);

      expect({ body, status }).toEqual({ status: 201, body: ResponsePayload.Succeeded(true) });
    });

    it('return 400 for absent argument "timestamp"', async () => {
      const query = {
        text: 'Hello, world!'
      };
      const { body, status } = await request(server).get(`/printMeAt?${stringifyQuery(query)}`);

      expect({ body, status }).toEqual({
        status: 400,
        body: ResponsePayload.Failed([ 'timestamp must be a positive number' ])
      });
    });

    it('return 400 for wrong argument "timestamp" (type)', async () => {
      const query = {
        text: 'Hello, world!',
        timestamp: 'Hey!'
      };
      const { body, status } = await request(server).get(`/printMeAt?${stringifyQuery(query)}`);

      expect({ body, status }).toEqual({
        status: 400,
        body: ResponsePayload.Failed([ 'timestamp must be a positive number' ])
      });
    });

    it('return 400 for wrong argument "timestamp" (value)', async () => {
      const query = {
        text: 'Hello, world!',
        timestamp: '-100'
      };
      const { body, status } = await request(server).get(`/printMeAt?${stringifyQuery(query)}`);

      expect({ body, status }).toEqual({
        status: 400,
        body: ResponsePayload.Failed([ 'timestamp must be a positive number' ])
      });
    });

    it('return 400 for absent argument "text"', async () => {
      const query = {
        timestamp: Date.now().toString(),
      };
      const { body, status } = await request(server).get(`/printMeAt?${stringifyQuery(query)}`);

      expect({ body, status }).toEqual({
        status: 400,
        body: ResponsePayload.Failed([ 'text must be a string', 'text must be longer than or equal to 1 characters' ])
      });
    });

    it('return 400 for wrong argument "text" (value)', async () => {
      const query = {
        text: '',
        timestamp: Date.now().toString(),
      };
      const { body, status } = await request(server).get(`/printMeAt?${stringifyQuery(query)}`);

      expect({ body, status }).toEqual({
        status: 400,
        body: ResponsePayload.Failed([ 'text must be longer than or equal to 1 characters' ])
      });
    });

  });
});
