import test from 'ava';
import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { Future, Option, None, Some } from 'funfix';
import { stub } from 'sinon';

import { cafebabe as user_id, getFakePool, fakePoolResult, createEvent } from './test-helpers';
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

const emit = (e: any) => undefined;

test('Test placeholder', async (t) => {
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

  const store = await newEventStore(getFakePool(readStub), emit);

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

  readStub
    .withArgs("PUT BASE QUERY HERE")
    .throws("This shouldn't happen");

  readStub
    .withArgs("PUT CACHE SEARCH QUERY")
    .resolves("This is right & should happen");

  readStub
    .withArgs("PUT THE NESTED SELECT QUERY")
     .resolves("This bit doesn't matter, we just need to know the query works");
  // this part should execute exactly once - there should only be one occurance of
  // this in readStub.args

  t.fail();
});
