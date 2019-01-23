import {
  EmitterAdapter,
  Event,
  EventData,
  EventContext,
  EmitterHandler,
  Logger,
  EventNamespaceAndType,
  EventNamespace,
} from "../../.";
import { Option, Some, None } from "funfix";
import setupIris from "@repositive/iris";
import { Iris } from "@repositive/iris";

export interface IrisOptions {
  uri?: string;
  namespace: EventNamespace;
}

export function wait(n: number): Promise<void> {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve, n);
  });
}

function wrapHandler(handler: EmitterHandler<any>, logger: Logger) {
  return function({ payload }: { payload?: any }) {
    logger.trace('receivedEvent', { payload });

    return handler(payload);
  };
}

export function createAQMPEmitterAdapter(
  irisOpts: IrisOptions,
  logger: Logger = console,
): EmitterAdapter {
  let iris: Option<Iris> = None;
  const subscriptions: Map<
    EventNamespaceAndType,
    EmitterHandler<any>
  > = new Map();
  setupIris({ ...irisOpts, logger })
    .map((_iris) => {
      iris = Some(_iris);
      for (const [pattern, handler] of subscriptions.entries()) {
        _iris.register({ pattern, handler: wrapHandler(handler, logger) });
      }
    })
    .subscribe();

  async function emit(event: Event<EventData, EventContext<any>>) {
    logger.trace('emitEvent', { event });

    await iris
      .map((i) => i.emit({ pattern: event.data.type, payload: event }))
      .getOrElseL(() => wait(1000).then(() => emit(event)));
  }

  function subscribe(
    pattern: EventNamespaceAndType,
    handler: EmitterHandler<any>,
  ) {
    const _handler = wrapHandler(handler, logger);

    logger.trace('subscribeToEvent', { pattern, hasIris: iris.nonEmpty() });

    iris
      .map((i) => {
        logger.trace('subscribeToEventHasIris', { pattern });

        i.register({ pattern, handler: _handler });

        subscriptions.set(pattern, handler);
      })
      .getOrElseL(() => {
        logger.trace('subscribeToEventNoIris', { pattern, wait: 1000 });

        wait(1000).then(() => subscribe(pattern, handler))
      });
  }

  return {
    emit,
    subscribe,
  };
}
