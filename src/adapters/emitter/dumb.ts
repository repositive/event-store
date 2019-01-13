import { EmitterAdapter, EmitterHandler, EventNamespaceAndType } from "../../";

export function createDumbEmitterAdapter(): EmitterAdapter {
  const subscriptions = new Map();

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

  return {
    emit,
    subscribe,
  };
}
