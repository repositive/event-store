import test from 'ava';
import { stub } from 'sinon';
import {EventStore, EventData, Event} from '.';

// Noop test, but will fail to compile if something doesn't work
test("listen type checks its string arguments", async (t) => {

  interface BarEvent extends EventData {
    event_namespace: "foo";
    event_type: "Bar";
  }

  interface BoomEvent extends EventData {
    event_namespace: 'foo';
    event_type: 'Boom';
  }

  const es: EventStore<any> = {
    listen: stub().resolves(),
  } as any;

  es.listen<BarEvent>("foo", "Bar", (_event: Event<BarEvent, any>) => Promise.resolve() as any);
  es.listen("foo", "Bar", (_event: Event<BarEvent, any>) => Promise.resolve() as any);

  // @ts-ignore This will blow up without ts-ignore
  es.listen<FooBar>("foo", "Bar", (event: Event<BoomEvent, any>) => Promise.resolve() as any);

  // @ts-ignore This will blow up without ts-ignore
  es.listen("foo", "Bar", (event: Event<BoomEvent, any>) => Promise.resolve() as any);

  t.pass();
});
