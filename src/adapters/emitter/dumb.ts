import { EmitterAdapter, EmitterHandler, EventNamespace, EventType, Subscriptions } from "../../";

export function createDumbEmitterAdapter(): EmitterAdapter {
  const subs = new Map();

  async function emit(event: any) {
    /* I DO NOT DO ANYTHING */
  }

  function subscribe(
    ns: EventNamespace,
    ty: EventType,
    handler: EmitterHandler<any>,
  ) {
    /* I DO NOT DO ANYTHING */
  }

  async function unsubscribe(ns: EventNamespace, ty: EventType) {
    /* I DO NOT DO ANYTHING */
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
