  <p align="center">Message logger :)</p>

## Installation

```bash
$ yarn install
```

## Running the app

```bash
# development
$ yarn start

# watch mode
$ yarn start:dev

# production mode
$ yarn start:prod
```

## Test

```bash
# unit tests
$ yarn test:unit

# e2e tests
$ yarn test:e2e

# all tests
$ yarn test

# test coverage
$ yarn test:cov
```

# Endpoints
```
[GET] /printMeAt
Query params:
  timestamp: number - time to log the message
  text: string - message text
```

## License

Nest is [MIT licensed](LICENSE).
