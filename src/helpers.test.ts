import { test } from 'ava';
import { id } from './test-helpers';
import { createEvent, createContext, EventData, EventContext, Event, isEvent } from '.';

// This test does nothing, but will fail to compile if Typescript finds errors, so should be left in
test("typechecks createEvent", (t: any) => {
  interface TestEvent extends EventData {
    type: "foobar.Baz";
    event_namespace: "foobar";
    event_type: "Baz";
    foo: string;
    bar: number;
  }

  const evt: Event<TestEvent, any> = createEvent("foobar", "Baz", {
    foo: "hello",
    bar: 10,
  });

  t.pass();
});

test('creates an event with default fields filled', (t: any) => {
  const evt = createEvent('ns', 'Type', { foo: 'bar' });

  const expected = {
    id,
    data: {
      type: 'ns.Type',
      event_type: 'Type',
      event_namespace: 'ns',
      foo: 'bar',
    },
    context: {
      subject: {},
      time: '2018-01-02 03-04-05',
    },
  };

  t.deepEqual(evt.data, expected.data);
  t.deepEqual(evt.context.subject, expected.context.subject);
  t.is(typeof evt.context.time, 'string');
  t.true(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i.test(evt.id));
});

test('creates an event with a given context', (t: any) => {
  const evt = createEvent(
    'ns',
    'Type',
    { foo: 'bar' },
    { subject: { bar: 'baz' }, time: '2018-01-02 03-04-05' },
    () => id,
  );

  const expected = {
    id,
    data: {
      type: 'ns.Type',
      event_type: 'Type',
      event_namespace: 'ns',
      foo: 'bar',
    },
    context: {
      subject: { bar: 'baz' },
      time: '2018-01-02 03-04-05',
    },
  };

  t.deepEqual(evt, expected);
});

test('creates a context with subject and no action', (t: any) => {
  const evt = createEvent(
    'ns',
    'Type',
    { foo: 'bar' },
    createContext({ bar: 'baz' }),
    () => id,
  );

  t.is(evt.context.action, undefined);
  t.deepEqual(evt.context.subject, { bar: 'baz' });
});

test('creates a context with subject and an action', (t: any) => {
  const evt = createEvent(
    'ns',
    'Type',
    { foo: 'bar' },
    createContext({ bar: 'baz' }, 'someRandomAction', () => '2018-01-02 03-04-05'),
    () => id,
  );

  const expected = {
    action: 'someRandomAction',
    subject: { bar: 'baz' },
    time: '2018-01-02 03-04-05',
  };

  t.deepEqual(evt.context, expected);
});

test('createEvent passes is Event', (t: any) => {
  const ev = createEvent('ns', 'Type', {});

  t.truthy(isEvent((o: any): o is any => !!o)(ev));
});
