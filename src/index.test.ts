import test from 'ava';
import * as R from 'ramda';
import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { Future, Option, None, Some } from 'funfix';
import { stub, spy, match } from 'sinon';

import {
  id,
  cafebabe as user_id,
  getFakePool,
  fakePoolResult,
  createEvent,
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

function isAccountCreated(o: any): o is AccountCreated {
  return o && o.type === 'AccountCreated';
}

function isNameChanged(o: any): o is NameChanged {
  return o && o.type === 'NameChanged';
}

function isEmailChanged(o: any): o is EmailChanged {
  return o && o.type === 'EmailChanged';
}

test('Aggregates', async (t) => {
  const readStub = stub();

  readStub
    .withArgs("SELECT * FROM events WHERE data->>'user_id' = $1 ORDER BY time ASC", [ user_id ])
    .resolves(fakePoolResult([
      createEvent('AccountCreated', {
        name: "Bobby Bowls",
        email: "bobby@bowls.com",
        user_id,
      }),

      createEvent('NameChanged', {
        name: "Bobby Beans",
        user_id,
      }),

      createEvent('EmailChanged', {
        email: "bobby@beans.com",
        user_id,
      }),
    ]));

  readStub
    .withArgs(
      'select * from aggregate_cache where id = $1',
      [ 'b83753e3336aaa7544d02abf12e085a3c95b96b2916acc96b36d5f5652f21723' ],
    )
    .resolves(fakePoolResult());

  const store = await newEventStore(getFakePool(readStub), fakeEmitter);

  const testAggregate = store.registerAggregate<[string], Option<User>>(
    'RandoAggregate',
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

  const result = await testAggregate(user_id);

  t.deepEqual(result.get(), {
    name: 'Bobby Beans',
    email: 'bobby@beans.com',
    user_id,
  });
});

test("Aggregator correctly forms cache query", async (t) => {
  const readStub = stub();

  const iso_time = "2018-07-27 10:19:24.428897";
  readStub
    .withArgs(
      "select * from aggregate_cache where id = $1",
      ['b83753e3336aaa7544d02abf12e085a3c95b96b2916acc96b36d5f5652f21723'],
    )
    .resolves(
      fakePoolResult([
         {
           id: '8871b5e0-2a67-4715-90e6-b4974ad0d6a7',
           aggregate_type: 'RandoAggregate',
           data: {some: 'stuff'},
           time: iso_time,
         },
        ],
      ),
    );

  readStub
    .resolves(
      fakePoolResult(),
    );
  // this part should execute exactly once - there should only be one occurance of
  // this in readStub.args

  const store = await newEventStore(getFakePool(readStub), fakeEmitter);

  const base_query =
    "SELECT * FROM events WHERE data->>'user_id' = $1 ORDER BY time ASC";

  const testAggregate = store.registerAggregate<[string], Option<User>>(
    'RandoAggregate',
    base_query,
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

  const result = await testAggregate(user_id);

  const target_query = `
        SELECT * FROM (${base_query}) as events
        where events.time > (${iso_time})
        order by events.time asc;
      `;
  // Check that the correct query is executed at least once
  t.truthy(R.find((query) => {
    return query[0] === target_query;
  })(readStub.args));

  // Check that the original query (the query that does not use the cache)
  // is never used
  t.falsy(R.find((query) => {
    return query[0] === base_query;
  })(readStub.args));
});

test('Event emitter', async (t) => {
  const emit = spy();
  const writeStub = stub();
  const data = { type: 'TestEvent', foo: 'bar' };
  const context = { actor: { baz: 'quux' }, time: '2018-01-01T01:01:01' };

  writeStub
    .withArgs(
      'INSERT INTO events(data, context) values($1) RETURNING *',
      match.array,
    )
    .resolves(fakePoolResult([{ ...createEvent('TestEvent', { foo: 'bar' }), context }]));

  const store = await newEventStore(getFakePool(writeStub), emit);

  await store.save(data, context);

  t.deepEqual(
    emit.firstCall.args as any,
    [{
      id,
      data: { ...data, type: 'TestEvent' },
      context,
      time: '2018-01-01 01:01:01',
    }] as any,
  );
});
