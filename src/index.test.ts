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

interface CreateAccount extends EventData {
  type: 'CreateAccount';
  user_id: string;
  name: string;
  email: string;
}

function isCreateAccount(o: any): o is CreateAccount {
  return o && o.type === 'CreateAccount';
}

const emit = (e: any) => { };

test('Test placeholder', async (t) => {
  const store = await newEventStore(pool, emit);

  const testAggregate = store.registerAggregate<[string], Option<User>>(
    'RandoAggregate',
    "SELECT * FROM events WHERE data->>'user_id' = $1",
    None,
    [
      [ isCreateAccount, (acc: any, d: any) => {
      console.log({ d, acc });
      return Some({ ...acc.getOrElse({}), user_id: d.user_id, name: d.name, email: d.email })
    } ],
      // [ (e: any) => e.type === "NameChange", (acc: any, e: any) => Some({ ...acc, name: e.name }) ],
      // [ (e: any) => e.type === "EmailChange", (acc: any, e: any) => Some({ ...acc, email: e.email }) ],
    ],
  );

  const result = await testAggregate(user_id);

  console.log({ result });

  t.fail();
});
