import { EmitterAdapter, EmitterHandler, EventNamespace, EventType, Subscriptions } from "../../";

export function createDumbEmitterAdapter(): EmitterAdapter {
  const subs = new Map();

  async function emit(_event: any) {
    /* I DO NOT DO ANYTHING */
  }

  function subscribe(
    _event_namespace: EventNamespace,
    _event_type: EventType,
    _handler: EmitterHandler<any>
  ) {
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
