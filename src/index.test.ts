import test from 'ava';
import {
  reduce,
  DuplicateError,
  newEventStore,
  AggregateMatches,
  Event,
  EventContext,
  composeAggregator,
  EventData,
  createEventReplayHandler,
  StoreAdapter,
  EmitterAdapter,
  EventReplayRequested,
  createEvent,
} from '.';
import { stub, spy } from 'sinon';
import { Some, None, Left, Right } from 'funfix';
import { v4 as uuid } from 'uuid';
import * as pino from 'pino';
import { id, getFakeStoreAdapter, createFakeIterator } from './test-helpers';

const logger = pino();
logger.level = 'fatal';

function toAsyncIter<T>(input: T[]): AsyncIterator<T> {
  let idx = 0;
  return {
    next: async (): Promise<any> => {
      idx++;
      if (idx > input.length) {
        return { done: true };
      } else {
        return { value: input[idx - 1], done: false };
      }
    },
  };
}

test('Test composeAggregator one match', async (t) => {
  const validate: any = stub();
  validate.returns(true);
  const logic: any = stub();
  logic.resolves(Some('test'));
  const matches: AggregateMatches<string> = [[validate, logic]];

  const aggregator = composeAggregator(matches);
  t.deepEqual(typeof aggregator, 'function');
  t.deepEqual(await aggregator(None, createEvent('test_namespace', 'EventTestType', {})), Some('test'));
});

test('Test composeAggregator no matches', async (t) => {
  const matches: AggregateMatches<string> = [];

  const aggregator = composeAggregator(matches);
  t.deepEqual(typeof aggregator, 'function');
  t.deepEqual(await aggregator(None, createEvent('test_namespace', 'EventTestType', {})), None);
});

test('Test composeAggregator one no matching match', async (t) => {
  const validate: any = stub();
  validate.returns(false);
  const logic: any = stub();
  logic.resolves(Some('test'));
  const matches: AggregateMatches<string> = [[validate, logic]];

  const aggregator = composeAggregator(matches);
  t.deepEqual(typeof aggregator, 'function');
  t.deepEqual(await aggregator(None, createEvent('test_namespace', 'EventTestType', {})), None);
});

test('Iter reducer', async (t) => {
  const executor = stub();
  executor.resolves(3);
  const iter = toAsyncIter([1, 2]);

  await reduce(iter, 0, executor);

  t.deepEqual(executor.callCount, 2);

  const args1 = executor.getCall(0).args;
  t.deepEqual(args1[0], 0); // Default accumulator
  t.deepEqual(args1[1], 1);

  const args2 = executor.getCall(1).args;
  t.deepEqual(args2[0], 3); // Executor returned in previous step
  t.deepEqual(args2[1], 2);
});

test('createAggregate returns none when no cache and no events', async (t) => {
  const readStub = stub();
  const store: any = {
    read: readStub,
  };

  readStub.returns(toAsyncIter([]));

  const es = await newEventStore(store, { logger });

  const matches: any = [[() => true, () => 'test']];
  const agg = es.createAggregate('Test', '*', matches);
  t.deepEqual(await agg(), None);
});

test('createAggregate throws when the internal aggregate crashes', async (t) => {
  const readStub = stub();
  const store: any = {
    read: readStub,
  };

  readStub.returns(toAsyncIter([1]));

  const es = await newEventStore(store, { logger });

  const scrochedAggregation = () => {
    throw new Error('Scronched');
  };
  const matches: any = [[() => true, scrochedAggregation]];
  const agg = es.createAggregate('Test', '*', matches);

  try {
    await agg();
    t.fail('This should throw an error');
  } catch (err) {
    if (err instanceof Error) {
      t.deepEqual(err.message, 'Scronched');
    } else {
      t.fail('Unexpected error');
    }
  }
});

test('save emits if everything is fine', async (t) => {
  const writeStub = stub();
  writeStub.resolves(Right(undefined));
  const store: any = {
    write: writeStub,
  };
  const emitStub = stub();
  emitStub.resolves();
  const emitter: any = { emit: emitStub, subscribe: () => Promise.resolve() };

  const es = await newEventStore(store, { logger, emitter });

  await es.save(createEvent('test_namespace', 'EventTestType', {}));

  t.deepEqual(writeStub.callCount, 1);

  t.deepEqual(emitStub.callCount, 1);
});

test('save does not emit on errors', async (t) => {
  const writeStub = stub();
  writeStub.resolves(Left(new Error('Boom')));
  const store: any = {
    write: writeStub,
  };
  const emitStub = stub();
  emitStub.resolves();
  const emitter: any = { emit: emitStub, subscribe: () => Promise.resolve() };

  const es = await newEventStore(store, { logger, emitter });

  try {
    await es.save(createEvent('test_namespace', 'EventTestType', {}));
    t.fail('On write errors save should reject');
  } catch (err) {
    if (err instanceof Error) {
      t.deepEqual(err.message, 'Boom');
      t.deepEqual(writeStub.callCount, 1);
      t.deepEqual(emitStub.callCount, 0);
    } else {
      t.fail('The catch object should be an error');
    }
  }
});

test('save does not emit on duplicates', async (t) => {
  const writeStub = stub();
  writeStub.resolves(Left(new DuplicateError()));
  const store: any = {
    write: writeStub,
  };
  const emitStub = stub();
  emitStub.resolves();
  const emitter: any = { emit: emitStub, subscribe: () => Promise.resolve() };

  const es = await newEventStore(store, { logger, emitter });

  await es.save(createEvent('test_namespace', 'EventTestType', {}));
  t.deepEqual(writeStub.callCount, 1);
  t.deepEqual(emitStub.callCount, 0);
});

test('replay handler reads correct events', async (t) => {
  const readSpy = stub().returns(createFakeIterator([]));
  const since = new Date().toISOString();
  const emit = spy();

  const store = await getFakeStoreAdapter({ readSinceStub: readSpy });

  const emitter = {
    emit: emit as any,
  } as EmitterAdapter;

  const replayHandler = createEventReplayHandler({ store, emitter });

  const evt: Event<EventReplayRequested, EventContext<any>> = {
    id,
    data: {
      type: '_eventstore.EventReplayRequested',
      event_namespace: '_eventstore',
      event_type: 'EventReplayRequested',
      requested_event_namespace: 'ns',
      requested_event_type: 'SomeType',
      since,
    },
    context: { subject: {}, time: '' },
  };

  replayHandler(evt);

  t.truthy(readSpy.calledWithExactly('ns.SomeType', Some(since)));
});

test('listen emits EventReplayRequested without existing events', async (t) => {
  const handler = stub();
  const emit = spy();
  const subscribe = spy();

  const store = await getFakeStoreAdapter({});

  const emitter = {
    emit: emit as any,
    subscribe: subscribe as any,
  } as EmitterAdapter;

  const es = await newEventStore(store, { logger, emitter });

  const namespc = 't';
  const evtype = 'event_type';

  await es.listen(namespc, evtype, handler);

  const event = emit.firstCall.args[0];

  t.deepEqual(event.data.type, `_eventstore.EventReplayRequested`);
  t.deepEqual(event.data.requested_event_namespace, namespc);
  t.deepEqual(event.data.requested_event_type, evtype);
  t.deepEqual(event.data.since, new Date(0).toISOString());
});

test('listen emits EventReplayRequested with existing events', async (t) => {
  const handler = stub();
  const emit = spy();
  const subscribe = spy();

  const lastEventOf: any = stub();
  const existingEvent = createEvent('test', 'Existing', {});
  lastEventOf.resolves(Some(existingEvent));

  const store = await getFakeStoreAdapter({lastEventOf});

  const emitter = {
    emit: emit as any,
    subscribe: subscribe as any,
  } as EmitterAdapter;

  const es = await newEventStore(store, { logger, emitter });

  const namespc = 't';
  const evtype = 'event_type';

  await es.listen(namespc, evtype, handler);

  const event = emit.firstCall.args[0];

  t.deepEqual(event.data.type, `_eventstore.EventReplayRequested`);
  t.deepEqual(event.data.requested_event_namespace, namespc);
  t.deepEqual(event.data.requested_event_type, evtype);
  t.deepEqual(event.data.since, existingEvent.context.time);
});

test('listen calls handler if event doesnt exist and saves after its execution', async (t) => {
  const handler = stub();
  handler.resolves(Right(undefined));
  const emit = spy();
  const subscribe = spy();

  const exists = stub().resolves(false);
  const saveStub = stub().resolves();
  const store = await getFakeStoreAdapter({exists, saveStub});

  const emitter = {
    emit: emit as any,
    subscribe: subscribe as any,
  } as EmitterAdapter;

  const es = await newEventStore(store, { logger, emitter });

  const namespc = 't';
  const evtype = 'event_type';

  await es.listen(namespc, evtype, handler);

  t.deepEqual(subscribe.secondCall.args[0], `${namespc}.${evtype}`);
  const wrapped_handler = subscribe.secondCall.args[1];

  const event = createEvent('test', 'event', {});
  await wrapped_handler(event);

  t.true(exists.calledWith(event.id));
  t.true(handler.calledOnce);
  t.true(saveStub.calledWith(event));
});

test('listen calls does not save event if handler fails', async (t) => {
  const handler = stub();
  handler.resolves(Left(undefined));
  const emit = spy();
  const subscribe = spy();

  const exists = stub().resolves(false);
  const saveStub = stub();
  const store = await getFakeStoreAdapter({exists, saveStub});

  const emitter = {
    emit: emit as any,
    subscribe: subscribe as any,
  } as EmitterAdapter;

  const es = await newEventStore(store, { logger, emitter });

  const namespc = 't';
  const evtype = 'event_type';

  await es.listen(namespc, evtype, handler);

  t.deepEqual(subscribe.secondCall.args[0], `${namespc}.${evtype}`);
  const wrapped_handler = subscribe.secondCall.args[1];

  const event = createEvent('test', 'event', {});
  await wrapped_handler(event);

  t.true(exists.calledWith(event.id));
  t.true(handler.calledOnce);
  t.true(saveStub.notCalled);
});

test('listen does not call handler if event already exists and does not save event', async (t) => {
  const handler = stub();
  handler.resolves(Right(undefined));
  const emit = spy();
  const subscribe = spy();

  const exists = stub().resolves(true);
  const saveStub = stub();
  const store = await getFakeStoreAdapter({exists, saveStub});

  const emitter = {
    emit: emit as any,
    subscribe: subscribe as any,
  } as EmitterAdapter;

  const es = await newEventStore(store, { logger, emitter });

  const namespc = 't';
  const evtype = 'event_type';

  await es.listen(namespc, evtype, handler);

  t.deepEqual(subscribe.secondCall.args[0], `${namespc}.${evtype}`);
  const wrapped_handler = subscribe.secondCall.args[1];

  const event = createEvent('test', 'event', {});
  await wrapped_handler(event);

  t.true(exists.calledWith(event.id));
  t.true(handler.notCalled);
  t.true(saveStub.notCalled);
});

// Noop test, but will fail to compile if something doesn't work
test('listen type checks its string arguments', async (t) => {
  interface DummyEvent extends EventData {
    event_namespace: 'foo';
    event_type: 'Bar';
  }

  const writeStub = stub().resolves(Left(new DuplicateError()));
  const store: any = {
    write: writeStub,
    lastEventOf: () => Promise.resolve(None) as any
  };
  const emitStub = stub().resolves();
  const emitter: any = { emit: emitStub, subscribe: () => Promise.resolve() };

  const es = await newEventStore(store, { logger, emitter });

  es.listen<DummyEvent>('foo', 'Bar', () => Promise.resolve() as any);

  t.pass();
});
