import test from 'ava';
import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { Future, Option, None, Some } from 'funfix';
import { stub } from 'sinon';

import {
  cafebabe as user_id,
  getFakePool,
  fakePoolResult,
  createEvent,
  truncateAll,
  insertEvent,
  getDbConnection,
  query,
  fakeEmitter,
} from './test-helpers';
import { newEventStore, Emitter, EventData } from './index';

interface User {
  user_id: string;
  name: string;
  email: string;
}

interface AccountCreated extends EventData {
  type: 'AccountCreated';
  user_id: string;
  name: string;
  email: string;
}

interface NameChanged extends EventData {
  type: 'NameChanged';
  user_id: string;
  name: string;
}

interface EmailChanged extends EventData {
  type: 'EmailChanged';
  user_id: string;
  email: string;
}

const isAccountCreated = (o: any): o is AccountCreated => o && o.type === 'AccountCreated';
const isNameChanged = (o: any): o is NameChanged => o && o.type === 'NameChanged';
const isEmailChanged = (o: any): o is EmailChanged => o && o.type === 'EmailChanged';

test('It works', async (t) => {
  await truncateAll();

  await insertEvent(createEvent('AccountCreated', {
    name: "Bobby Bowls",
    email: "bobby@bowls.com",
    user_id,
  }));

  await insertEvent(createEvent('NameChanged', {
    name: "Bobby Beans",
    user_id,
  }));

  await insertEvent(createEvent('EmailChanged', {
    email: "bobby@beans.com",
    user_id,
  }));

  const store = await newEventStore(getDbConnection(), fakeEmitter);

  const testAggregate = store.registerAggregate(
    'IntegrationAggregate',
    "SELECT * FROM events WHERE data->>'user_id' = $1 ORDER BY time ASC",
    None,
    [
      [
        isAccountCreated,
        (acc: any, d: any) => Some({
          ...acc.getOrElse({}),
          user_id: d.user_id,
          name: d.name,
          email: d.email,
        }),
      ],
      [ isNameChanged, (acc: any, d: any) => Some({ ...acc.getOrElse({}), name: d.name }) ],
      [ isEmailChanged, (acc: any, d: any) => Some({ ...acc.getOrElse({}), email: d.email }) ],
    ],
  );

  const expected = {
    name: 'Bobby Beans',
    email: 'bobby@beans.com',
    user_id,
  };

  const result = await testAggregate(user_id);

  const cache = await query("SELECT * FROM aggregate_cache");

  t.is(cache.length, 1);
  t.is(cache[0].id, 'b83753e3336aaa7544d02abf12e085a3c95b96b2916acc96b36d5f5652f21723');
  t.deepEqual(cache[0].data, expected);
  t.is(cache[0].aggregate_type, '');

  t.deepEqual(result.get(), expected);
});
