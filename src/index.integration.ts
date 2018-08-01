import test from 'ava';
import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { Future, Option, None, Some } from 'funfix';
import { stub } from 'sinon';

import { cafebabe as user_id, getFakePool, fakePoolResult, createEvent } from './test-helpers';
import { newEventStore, Emitter, EventData } from './index';

test('Sorts by created date ascending', async (t) => {
  t.fail();
});
