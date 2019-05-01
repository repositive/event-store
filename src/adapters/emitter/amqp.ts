import {
    EmitterAdapter,
    Event,
    EventData,
    EventContext,
    EmitterHandler,
    Logger,
    EventNamespaceAndType,
    Subscriptions,
} from "../../.";
import { Channel, Message } from 'amqplib';

/**
 * Available options for the adapter
 * You can provide the namespace or set an environment variable `AMQP_EXCHANGE`
 * defaut exchange is called `event_store`
 * You can provide the namespace or set an environment variable `AMQP_NAMESPACE`
 * default namespace is `default`
 */
export interface AmqpAdapterOptions {
    logger?: Logger;
    exchange?: string;
    namespace?: string;
}

const namespace = process.env.AMQP_NAMESPACE;
const exchange = process.env.AMQP_EXCHANGE;

export const default_amqp_options = {
    logger: console,
    exchange: exchange || 'event_store',
    namespace: namespace || 'default'
};

// Helper function used to wait until the queue is created
// This functions receives a handler and execuetes it until it returns true.
async function waitUntil(check: () => boolean): Promise<void> {
    function waitImmediate(): Promise<void> {
        return new Promise((resolve) => {
            setImmediate(() => {
                resolve();
            })
        });
    }

    while (true) {
        if (check()) {
            break;
        }
        await waitImmediate();
    }
}

export function createAMQPEmitterAdapter(
    channel: Channel,
    options: AmqpAdapterOptions = default_amqp_options
): EmitterAdapter {
    const subs: Subscriptions = new Map();
    const { logger, exchange, namespace } = options as typeof default_amqp_options;

    // This flag is used by the subscribe queue to evaluate
    // When is safe to start listening for events.
    // This flat is set to true when the exchange and queue are succesfully created
    let queueCreated = false;

    channel.assertExchange(exchange, "topic").then(() => {
        return channel.assertQueue(namespace);
    })
        .then(() => {
            queueCreated = true;
        })
        .catch((err) => {
            // Creating the exchange and queue is mandatory.
            // if an error happens, abort the program.
            logger.error(err);
            process.exit(1);
        });

    async function emit(event: Event<EventData, EventContext<any>>) {
        const routing_key = `${event.data.event_namespace}.${event.data.event_type}`;
        const payload = Buffer.from(JSON.stringify(event));
        await channel.publish(exchange, routing_key, payload);
    }

    async function subscribe(
        pattern: EventNamespaceAndType,
        handler: EmitterHandler<any>
    ): Promise<any> {
        logger.trace({ pattern }, 'amqpSubscribe');

        function handleMessage(msg: Message) {
            const event: Event<EventData, EventContext<any>> = JSON.parse(msg.content.toString());
            const event_type = `${event.data.event_namespace}.${event.data.event_type}`;
            if (event_type === pattern) {
                handler(event);
            }
        }

        await waitUntil(() => queueCreated);
        await channel.bindQueue(namespace, exchange, pattern);
        await channel.consume(
            namespace,
            handleMessage,
            { noAck: false }
        );

        subs.set(pattern, handler);
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
