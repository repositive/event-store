import { EmitterAdapter, Event, EventData, EventContext, EventHandler, Logger } from '../../.';
import { Option, Some, None } from 'funfix';
import setupIris from '@repositive/iris';
import { Iris } from '@repositive/iris';

export interface IrisOptions {
  uri?: string;
  namespace: string;
}

export function wait(n: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve, n);
  });
}

function wrapHandler(handler: EventHandler<any>) {
  return function({payload}: {payload?: any}) {
    return handler(payload);
  };
}

export function createAQMPEmitterAdapter(irisOpts: IrisOptions, logger: Logger = console): EmitterAdapter {
  let iris: Option<Iris> = None;
  const subscriptions: Map<string, EventHandler<any>> = new Map();
  setupIris({ ...irisOpts, logger}).map((_iris) => {
    iris = Some(_iris);
    for ( const [pattern, handler] of subscriptions.entries()) {
      _iris.register({pattern, handler: wrapHandler(handler)});
    }
  })
  .subscribe();

  async function emit(event: Event<EventData, EventContext<any>>) {
    await iris
      .map((i) => i.emit({pattern: event.data.type, payload: event}))
      .getOrElseL(() => wait(1000).then(() => emit(event)));
  }

  function subscribe(pattern: string, handler: EventHandler<any>) {
    const _handler = wrapHandler(handler);

    iris.map((i) => {
      i.register({pattern, handler: _handler});
    });
    subscriptions.set(pattern, handler);
  }

  async function unsubscribe(pattern: string) {
    subscriptions.delete(pattern);
  }

  return {
    emit,
    subscribe,
    unsubscribe,
    subscriptions,
  };
}
