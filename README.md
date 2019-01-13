# Event store

[![CircleCI](https://circleci.com/gh/repositive/event-store/tree/master.svg?style=svg)](https://circleci.com/gh/repositive/event-store/tree/master)

An implementation of the event sourcing paradigm in Typescript.

## [Documentation](https://repositive.github.io/event-store/doc)

Start by looking at the [`EventStore`](https://repositive.github.io/event-store/doc/classes/eventstore.html) class.

## Development

```bash
npm install

npm run compile

docker-compose up -d

npm test

docker-compose run integration_tests
```

The database is started at `postgres://repositive:repositive@localhost:5433/event-store`. Run `db.sql` (user/pass `repositive`/`repositive`) to create the table structure and `test.sql` to add some sample data.

## Building documentation

* `yarn doc`
* Open `doc/index.html` in your favourite browser
