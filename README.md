# Event store

Quickstart

```bash
yarn install

docker-compose up -d

yarn test

docker-compose run integration_tests
```

The database is started at `postgres://repositive:repositive@localhost:5433/event-store`. Run `db.sql` to create the table structure and `test.sql` to add some sample data.

## Documentation

* `yarn doc`
* Open `doc/index.html` in your favourite browser
