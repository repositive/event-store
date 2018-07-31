import test from 'ava';
import { Client, Pool } from 'pg';
import { Future, Option, None, Some } from 'funfix';

import { cafebabe as user_id } from './test-helpers';
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
  const store = await newEventStore(pool, emit);

  const testAggregate = store.registerAggregate<[string], Option<User>>(
    'RandoAggregate',
    "SELECT * FROM events WHERE data->>'user_id' = $1",
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
    name: 'Bobby Bowls',
    email: 'bobby@bowls.com',
    user_id,
  });
});
