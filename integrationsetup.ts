import test from 'ava';
import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { Future, Option, None, Some } from 'funfix';
import { stub } from 'sinon';
import * as fs from 'fs';

import { getDbConnection } from './src/test-helpers';

test('Integration test setup', async (t) => {
  // Create DB structure
  await getDbConnection().query(fs.readFileSync("./db.sql", { encoding: 'utf8' }));

  // Insert sample data
  // await client.query(fs.readFileSync("./integration.sql", { encoding: 'utf8' }));

  t.pass();
});
