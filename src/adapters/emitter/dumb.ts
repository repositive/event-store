import { EmitterAdapter, EmitterHandler, EventNamespaceAndType, Subscriptions } from "../../";

export function createDumbEmitterAdapter(): EmitterAdapter {
  const subs = new Map();

  async function emit(event: any) {
    /* I DO NOT DO ANYTHING */
  }

  function subscribe(
    pattern: EventNamespaceAndType,
    handler: EmitterHandler<any>,
  ) {
    /* I DO NOT DO ANYTHING */
  }

  async function unsubscribe(pattern: EventNamespaceAndType) {
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
