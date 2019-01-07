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
class EventStore {
    constructor(store_adapter, options = {}) {
        this.store = store_adapter;
        this.cache = options.cache || _1.createDumbCacheAdapter();
        this.emitter = options.emitter || _1.createDumbEmitterAdapter();
        this.logger = options.logger || console;
        this.emitter.subscribe('_eventstore.EventReplayRequested', createEventReplayHandler({ store: this.store, emitter: this.emitter }));
    }
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
    createAggregate(aggregateName, query, matches) {
        const _impl = (...args) => __awaiter(this, void 0, void 0, function* () {
            const start = Date.now();
            const id = crypto_1.createHash('sha256')
                .update(aggregateName + JSON.stringify(query) + JSON.stringify(args))
                .digest('hex');
            const latestSnapshot = yield this.cache.get(id);
            this.logger.trace('cacheSnapshot', latestSnapshot);
            const results = this.store.read(query, latestSnapshot.flatMap((snapshot) => funfix_1.Option.of(snapshot.time)), ...args);
            const aggregatedAt = new Date();
            const aggregator = composeAggregator(matches);
            const aggregatedResult = yield reduce(results, latestSnapshot.map((snapshot) => snapshot.data), aggregator);
            this.logger.trace('aggregatedResult', aggregatedResult);
            yield aggregatedResult.map((result) => {
                const snapshotHash = latestSnapshot
                    .map((snapshot) => {
                    return crypto_1.createHash('sha256')
                        .update(JSON.stringify(snapshot.data))
                        .digest('hex');
                })
                    .getOrElse('');
                const toCacheHash = crypto_1.createHash('sha256')
                    .update(JSON.stringify(result))
                    .digest('hex');
                if (snapshotHash !== toCacheHash) {
                    this.logger.trace('save to cache', result);
                    return this.cache.set(id, { data: result, time: aggregatedAt.toISOString() });
                }
            });
            this.logger.trace('aggregateLatency', {
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
    listen(event_namespace, event_type, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const pattern = [event_namespace, event_type].join('.');
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
            const replay = helpers_1.createEvent('_eventstore', 'EventReplayRequested', {
                requested_event_namespace: event_namespace,
                requested_event_type: event_type,
                since: last.map((l) => l.context.time).getOrElse(new Date(0).toISOString()),
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
            const events = store.readEventSince([event.data.requested_event_namespace, event.data.requested_event_type].join('.'), funfix_1.Option.of(event.data.since));
            // Emit all events;
            reduce(events, funfix_1.None, (acc, e) => __awaiter(this, void 0, void 0, function* () {
                yield emitter.emit(e);
                return funfix_1.None;
            }));
        });
    };
}
exports.createEventReplayHandler = createEventReplayHandler;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXZlbnQtc3RvcmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvZXZlbnQtc3RvcmUudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUFBLHdCQVlXO0FBQ1gsbUNBQW9EO0FBRXBELG1DQUFvQztBQUNwQyx1Q0FBd0M7QUFtQnhDLE1BQWEsVUFBVTtJQU1yQixZQUFZLGFBQThCLEVBQUUsVUFBNkIsRUFBRTtRQUN6RSxJQUFJLENBQUMsS0FBSyxHQUFHLGFBQWEsQ0FBQztRQUMzQixJQUFJLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLElBQUkseUJBQXNCLEVBQUUsQ0FBQztRQUN2RCxJQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLElBQUksMkJBQXdCLEVBQUUsQ0FBQztRQUM3RCxJQUFJLENBQUMsTUFBTSxHQUFHLE9BQU8sQ0FBQyxNQUFNLElBQUksT0FBTyxDQUFDO1FBRXhDLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUNwQixrQ0FBa0MsRUFDbEMsd0JBQXdCLENBQUMsRUFBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLE9BQU8sRUFBQyxDQUFDLENBQ3JFLENBQUM7SUFDSixDQUFDO0lBRVksSUFBSSxDQUFDLEtBQTBDOztZQUMxRCxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLE1BQU0sRUFBRSxFQUFFO2dCQUM1QyxPQUFPLE1BQU07cUJBQ1YsR0FBRyxDQUFDLEdBQUcsRUFBRTtvQkFDUixnREFBZ0Q7b0JBQ2hELE9BQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7Z0JBQ2xDLENBQUMsQ0FBQztxQkFDRCxVQUFVLENBQUMsR0FBRyxFQUFFO29CQUNmLE9BQU8sTUFBTTt5QkFDVixJQUFJLEVBQUU7eUJBQ04sR0FBRyxD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