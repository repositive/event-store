"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const funfix_1 = require("funfix");
const crypto_1 = require("crypto");
const helpers_1 = require("./helpers");
/**
Main event store class

An event store requires an implementation of three things; {@link StoreAdapter},
{@link EmitterAdapter} and {@link CacheAdapter}. The following example uses Postgres for the backing
store and cache, and an AMQP (RabbitMQ) queue to emit and subscribe to events. Note the typo in
`AQMPEmitterAdapter`.

```typescript
import {
  createAQMPEmitterAdapter,
  createPgStoreAdapter,
  createPgCacheAdapter,
  EventStore
} from '@repositive/event-store';

const emitterAdapter = createAQMPEmitterAdapter(irisOpts);
const storeAdapter = createPgStoreAdapter(postgres);
const cacheAdapter = createPgCacheAdapter(postgres);

const store = new EventStore(storeAdapter, {cache: cacheAdapter, emitter: emitterAdapter});
```

The store uses `console` as its default logger, but can be overridden by passing in extra arguments.
The following example uses [Pino](http://npmjs.com/pino).

```typescript
import * as pino from 'pino';
import {
  createAQMPEmitterAdapter,
  createPgStoreAdapter,
  createPgCacheAdapter,
  EventStore
} from '@repositive/event-store';

const logger = pino();

const emitterAdapter = createAQMPEmitterAdapter(irisOpts, logger);
const storeAdapter = createPgStoreAdapter(postgres, logger);
const cacheAdapter = createPgCacheAdapter(postgres, logger);

const store = new EventStore(
  storeAdapter,
  {cache: cacheAdapter, emitter: emitterAdapter, logger}
);
```

Any logger can be used that implements the {@link Logger} interface.

@param Q - The query type of the backing store

For example, when using a Postgres store, this should be `string`. Other databases may accept
different types
*/
class EventStore {
    /**
    Create a new event store
  
    @param store_adapter - The backing store used to save and retrieve events
  
    @param options - Cache adapter, emitter adapter and (optional) logger to use
    */
    constructor(store_adapter, options = {}) {
        this.store = store_adapter;
        this.cache = options.cache || _1.createDumbCacheAdapter();
        this.emitter = options.emitter || _1.createDumbEmitterAdapter();
        this.logger = options.logger || console;
        this.emitter.subscribe("_eventstore.EventReplayRequested", createEventReplayHandler({ store: this.store, emitter: this.emitter }));
    }
    /**
    Save an event and emit it onto the queue
  
    @param event - The event to save and emit
    */
    save(event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.store.write(event).then((result) => {
                return result
                    .map(() => {
                    // If there are no errors saving, emit the event
                    return this.emitter.emit(event);
                })
                    .getOrElseL(() => {
                    return result
                        .swap()
                        .map((error) => {
                        if (error instanceof _1.DuplicateError) {
                            return Promise.resolve();
                        }
                        return Promise.reject(error);
                    })
                        .get();
                });
            });
        });
    }
    /**
    Prepare and return an aggregator function
  
    Use this to create an aggregate that can be used by the rest of the application.
  
    @example
  
    ```typescript
    import { EventStore, PgQuery, Aggregate, isEvent } from '@repositive/event-store';
    import {
      isThingCreated,
      isThingUpdated,
      ThingUpdated,
      ThingCreated
    } from './events';
  
    export interface Thing {
      // ...
    }
  
    const onThingCreated = async (
      acc: Option<Thing>,
      event: Event<ThingCreated, EventContext<any>>
    ): Promise<Option<Thing>> => {
      // ...
    };
  
    const onThingUpdated = async (
      acc: Option<Thing>,
      event: Event<ThingUpdated, EventContext<any>>
    ): Promise<Option<Thing>> => {
      // ...
    };
  
    export function prepareThingById(
      store: EventStore<PgQuery>
    ): Aggregate<[string], Thing> {
      return store.createAggregate(
        'thingById',
        {
          text: `select * from events where data->>'thing_id' = $1`
        },
        [
          [isEvent(isThingCreated), onThingCreated],
          [isEvent(isThingUpdated), onThingUpdated]
        ]
      );
    }
    ```
  
    The above example will create an aggregator with the identifier `ThingById` that accepts one
    argument (a thing ID) and returns the fictional `Thing` object. It queries the database for all
    events that contain a data field called `thing_id` with a value equal to the given input.
  
    It supports two events; `ThingCreated` and `ThingUpdated`, handled by `onThingCreated` and
    `onThingUpdated` respectively.
  
    @param aggregateName - The unique identifier of this aggregate. It is good convention to name it
    the same as the aggregate function, i.e. `thingById` in the example above.
  
    @param query - The query sent to the database to select events to aggregate over. This can return
    other events than those desired; they will be ignored if no handler for them is specified in the
    `matches` list.
  
    @param matches - A list of pairs where the first item determines whether the second should be
    executed. `matches` is evaluated against every event returned from the backing store, with the
    first match from top to bottom being called for that event. This defines the relationship between
    events and their handlers.
  
    The {@link isEvent} helper can be used to reduce boilerplate. An example `isThingCreated` function
    may look like this:
  
    ```typescript
    export function isThingCreated(o: any): o is ThingUpdated {
      return o && o.type === 'thingdomain.ThingUpdated';
    }
    ```
  
    @returns Result of aggregation over queried events
    */
    createAggregate(aggregateName, query, matches) {
        const _impl = (...args) => __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            const id = crypto_1.createHash("sha256")
                .update(aggregateName + JSON.stringify(query) + JSON.stringify(args))
                .digest("hex");
            const latestSnapshot = yield this.cache.get(id);
            this.logger.trace("cacheSnapshot", latestSnapshot);
            const results = this.store.read(query, latestSnapshot.flatMap((snapshot) => funfix_1.Option.of(snapshot.time)), ...args);
            const aggregatedAt = new Date();
            const aggregator = composeAggregator(matches);
            const aggregatedResult = yield reduce(results, latestSnapshot.map((snapshot) => snapshot.data), aggregator);
            this.logger.trace("aggregatedResult", aggregatedResult);
            yield aggregatedResult.map((result) => {
                const snapshotHash = latestSnapshot
                    .map((snapshot) => {
                    return crypto_1.createHash("sha256")
                        .update(JSON.stringify(snapshot.data))
                        .digest("hex");
                })
                    .getOrElse("");
                const toCacheHash = crypto_1.createHash("sha256")
                    .update(JSON.stringify(result))
                    .digest("hex");
                if (snapshotHash !== toCacheHash) {
                    this.logger.trace("save to cache", result);
                    return this.cache.set(id, {
                        data: result,
                        time: aggregatedAt.toISOString(),
                    });
                }
            });
            this.logger.trace("aggregateLatency", {
                query,
                args,
                query_time: aggregatedAt.getTime() - start,
                aggregate_time: Date.now() - aggregatedAt.getTime(),
                total_time: Date.now() - start,
            });
            return aggregatedResult;
        });
        return _impl;
    }
    /**
    Listen for events emitted by other event stores
  
    When this method is called, a subscription is initialised and an {@link EventReplayRequested}
    event is emitted. This allows this store to receive events it may have missed due to save errors,
    downtime or deployments.
  
    @param event_namespace - The remote namespace to listen to
  
    @param event_type - The event type to listen for
  
    @param handler - Handler function called for every received event. The event will be saved to the
    backing store before this handler is called, therefore can be retrieved with an aggregator. If the
    event cannot be saved, or already exists in the database, the handler will not be called
    */
    listen(event_namespace, event_type, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = [event_namespace, event_type].join(".");
            const _handler = (event) => __awaiter(this, void 0, void 0, function* () {
                const exists = yield this.store.exists(event.id);
                if (!exists) {
                    const result = yield handler(event, this);
                    yield result
                        .map(() => {
                        return this.store.write(event);
                    })
                        .getOrElse(Promise.resolve());
                }
            });
            this.emitter.subscribe(pattern, _handler);
            const last = yield this.store.lastEventOf(pattern);
            const replay = helpers_1.createEvent("_eventstore", "EventReplayRequested", {
                requested_event_namespace: event_namespace,
                requested_event_type: event_type,
                since: last
                    .map((l) => l.context.time)
                    .getOrElse(new Date(0).toISOString()),
            });
            yield this.emitter.emit(replay);
        });
    }
}
exports.EventStore = EventStore;
function reduce(iter, acc, f) {
    return __awaiter(this, void 0, void 0, function* () {
        let _acc = acc;
        while (true) {
            const _next = yield iter.next();
            if (_next.done) {
                return _acc;
            }
            else {
                _acc = yield f(_acc, _next.value);
            }
        }
    });
}
exports.reduce = reduce;
/**
 *  Compose a list of maching functions into an aggregator
 *
 */
function composeAggregator(matches) {
    return (acc, event) => __awaiter(this, void 0, void 0, function* () {
        return matches.reduce((matchAcc, [validate, execute]) => {
            if (validate(event)) {
                return execute(matchAcc, event);
            }
            return matchAcc;
        }, acc);
    });
}
exports.composeAggregator = composeAggregator;
function createEventReplayHandler({ store, emitter, }) {
    return function handleEventReplay(event) {
        return __awaiter(this, void 0, void 0, function* () {
            const events = store.readEventSince([
                event.data.requested_event_namespace,
                event.data.requested_event_type,
            ].join("."), funfix_1.Option.of(event.data.since));
            // Emit all events;
            reduce(events, funfix_1.None, (acc, e) => __awaiter(this, void 0, void 0, function* () {
                yield emitter.emit(e);
                return funfix_1.None;
            }));
        });
    };
}
exports.createEventReplayHandler = createEventReplayHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQtc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHdCQWVXO0FBQ1gsbUNBQW9EO0FBRXBELG1DQUFvQztBQUNwQyx1Q0FBd0M7QUF5QnhDOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztFQXFERTtBQUNGLE1BQWEsVUFBVTtJQU1yQjs7Ozs7O01BTUU7SUFDRixZQUFZLGFBQThCLEVBQUUsVUFBNkIsRUFBRTtRQUN6RSxJQUFJLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUkseUJBQXNCLEVBQUUsQ0FBQztRQUN2RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksMkJBQXdCLEVBQUUsQ0FBQztRQUM3RCxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDO1FBRXhDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUNwQixrQ0FBa0MsRUFDbEMsd0JBQXdCLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQ3ZFLENBQUM7SUFDSixDQUFDO0lBRUQ7Ozs7TUFJRTtJQUNXLElBQUksQ0FBQyxLQUEwQzs7WUFDMUQsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLEVBQUUsRUFBRTtnQkFDNUMsT0FBTyxNQUFNO3FCQUNWLEdBQUcsQ0FBQyxHQUFHLEVBQUU7b0JBQ1IsZ0RBQWdEO29CQUNoRCxPQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxD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