import {
  EmitterAdapter,
  Event,
  EventData,
  EventContext,
  EmitterHandler,
  Logger,
  EventNamespace,
  EventType,
  Subscriptions,
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
  logger: Logger = console
): EmitterAdapter {
  let iris: Option<Iris> = None;
  const subs: Subscriptions = new Map();

  setupIris({ ...irisOpts, logger })
    .map((_iris) => {
      iris = Some(_iris);
      for (const [pattern, handler] of subs.entries()) {
        _iris.register({ pattern, handler: wrapHandler(handler) });
      }
    })
    .subscribe();

  async function emit(event: Event<EventData, EventContext<any>>) {
    await iris
      .map((i) =>
        i.emit({
          pattern: `${event.data.event_namespace}.${event.data.event_type}`,
          payload: event,
        })
      )
      .getOrElseL(() => wait(1000).then(() => emit(event)));
  }

  async function subscribe(
    event_namespace: EventNamespace,
    event_type: EventType,
    handler: EmitterHandler<any>,
    _attempt = 0
  ): Promise<any> {
    const pattern = `${event_namespace}.${event_type}`;

    logger.trace({ event_namespace, event_type, pattern, _attempt }, "amqpSubscribe");

    const _handler = wrapHandler(handler);

    subs.set(pattern, handler);

    return iris
      .map(
        (i): Promise<any> => {
          logger.trace({ pattern, _attempt }, "amqpSubscribeHasIris");

          return i.register({ pattern, handler: _handler });
        }
      )
      .getOrElseL(
        async (): Promise<any> => {
          const waitTime = 1000;

          logger.trace({ pattern, _attempt, waitTime }, "amqpSubscribeNoIris");

          await wait(waitTime);

          logger.trace({ pattern, _attempt, waitTime }, "amqpSubscribeRetry");

          subscribe(event_namespace, event_type, handler, _attempt + 1);
        }
      );
  }

  function subscriptions(): Subscriptions {
    return subs;
  }

  return {
    emit,
    subscribe,
    subscriptions,
  };
}
