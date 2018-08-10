import { EmitterAdapter, EventHandler } from '../../';

export function createDumbEmitterAdapter(): EmitterAdapter {

  const subscriptions = new Map();

  async function emit(event: any) {
    /* I DO NOT DO ANYTHING */
  }

  function subscribe(pattern: string, handler: EventHandler<any>) {
    /* I DO NOT DO ANYTHING */
  }

  async function unsubscribe(pattern: string) {
    /* I DO NOT DO ANYTHING */
  }

  return {
    emit,
    subscribe,
    unsubscribe,
    subscriptions,
  };
}
