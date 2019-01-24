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
  return new Promise((resolve) => setTimeout(resolve, n));
}

function wrapHandler(handler: EmitterHandler<any>) {
  return function({ payload }: { payload?: any }) {
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
        _iris.register({ pattern, handler: wrapHandler(handler) });
      }
    })
    .subscribe();

  async function emit(event: Event<EventData, EventContext<any>>) {
    await iris
      .map((i) => i.emit({ pattern: event.data.type, payload: event }))
      .getOrElseL(() => wait(1000).then(() => emit(event)));
  }

  async function subscribe(
    pattern: EventNamespaceAndType,
    handler: EmitterHandler<any>,
    _attempt = 0,
  ): Promise<any> {
    logger.trace('amqpSubscribe', { pattern, _attempt });

    const _handler = wrapHandler(handler);

    subscriptions.set(pattern, handler);

    return iris.map((i): Promise<any> => {
      logger.trace('amqpSubscribeHasIris', { pattern, _attempt });

      return i.register({ pattern, handler: _handler });
    })
    .getOrElseL(async (): Promise<any> => {
      const waitTime = 1000;

      logger.trace('amqpSubscribeNoIris', { pattern, _attempt, waitTime });

      await wait(waitTime);

      logger.trace('amqpSubscribeRetry', { pattern, _attempt, waitTime });

      subscribe(pattern, handler, _attempt + 1);
    });
  }

  return {
    emit,
    subscribe,
  };
}
