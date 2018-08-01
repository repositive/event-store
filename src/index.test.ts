import test from 'ava';
import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { Future, Option, None, Some } from 'funfix';
import { stub } from 'sinon';

import { cafebabe as user_id, getFakePool } from './test-helpers';
import { newEventStore, Emitter, EventData } from './index';

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'event-store',
  port: 5431,
});

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
    .resolves({
      rows: [
        {
          id : "66927ffa-44ea-4f81-a993-297426c1dc6b",
          data : {
            type: "AccountCreated",
            name: "Bobby Bowls",
            email: "bobby@bowls.com",
            user_id,
          },
          context : {},
          time : "2018-07-31 10:49:57.591893",
        },
        {
          id : "1e07408f-f1ac-4dbf-83a2-c3e8dc63802c",
          data : {
            type: "NameChanged",
            name: "Bobby Beans",
            user_id,
          },
          context : {},
          time : "2018-07-31 10:59:57.591893",
        },
        {
          id : "cdd1c522-5fa1-47ec-80a5-0003f5ae7a73",
          data : {
            type: "EmailChanged",
            email: "bobby@beans.com",
            user_id,
          },
          context : {},
          time : "2018-07-31 11:09:57.591893",
        },
      ],
      totalCount: 3,
    });

  readStub
    .withArgs(
      'select * from aggregate_cache where id = $1',
      [ 'b83753e3336aaa7544d02abf12e085a3c95b96b2916acc96b36d5f5652f21723' ],
    )
    .resolves({
      rows: [],
      totalCount: 0,
    });

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
