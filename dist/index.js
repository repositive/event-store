"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const funfix_1 = require("funfix");
const crypto_1 = require("crypto");
const uuid_1 = require("uuid");
var helpers_1 = require("./helpers");
exports.createEvent = helpers_1.createEvent;
exports.createContext = helpers_1.createContext;
__export(require("./adapters"));
const adapters_1 = require("./adapters");
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
function isEvent(isData = (o) => true, isContext = (o) => true) {
    return function (o) {
        return (o && typeof o.id === 'string' && o.data && isData(o.data) && o.context && isContext(o.context));
    };
}
exports.isEvent = isEvent;
class DuplicateError extends Error {
}
exports.DuplicateError = DuplicateError;
function newEventStore(store, _options) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = _options || {};
        const { cache = adapters_1.createDumbCacheAdapter(), emitter = adapters_1.createDumbEmitterAdapter(), logger = console, } = options;
        function createAggregate(aggregateName, query, matches) {
            function _impl(...args) {
                return __awaiter(this, void 0, void 0, function* () {
                    const start = Date.now();
                    const id = crypto_1.createHash('sha256')
                        .update(aggregateName + JSON.stringify(query) + JSON.stringify(args))
                        .digest('hex');
                    const latestSnapshot = yield cache.get(id);
                    logger.trace('cacheSnapshot', latestSnapshot);
                    const results = store.read(query, latestSnapshot.flatMap((snapshot) => funfix_1.Option.of(snapshot.time)), ...args);
                    const aggregatedAt = new Date();
                    const aggregator = composeAggregator(matches);
                    const aggregatedResult = yield reduce(results, latestSnapshot.map((snapshot) => snapshot.data), aggregator);
                    logger.trace('aggregatedResult', aggregatedResult);
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
                            logger.trace('save to cache', result);
                            return cache.set(id, { data: result, time: aggregatedAt.toISOString() });
                        }
                    });
                    logger.trace('aggregateLatency', {
                        query,
                        args,
                        query_time: aggregatedAt.getTime() - start,
                        aggregate_time: Date.now() - aggregatedAt.getTime(),
                        total_time: Date.now() - start,
                    });
                    return aggregatedResult;
                });
            }
            return _impl;
        }
        function save(event) {
            return __awaiter(this, void 0, void 0, function* () {
                yield store.write(event).then((result) => {
                    return result
                        .map(() => {
                        // If there are no errors saving, emit the event
                        return emitter.emit(event);
                    })
                        .getOrElseL(() => {
                        return result
                            .swap()
                            .map((error) => {
                            if (error instanceof DuplicateError) {
                                return Promise.resolve();
                            }
                            return Promise.reject(error);
                        })
                            .get();
                    });
                });
            });
        }
        function listen(event_namespace, event_type, handler) {
            return __awaiter(this, void 0, void 0, function* () {
                const pattern = [event_namespace, event_type].join('.');
                emitter.subscribe(pattern, handler);
                const last = yield store.lastEventOf(pattern);
                emitter.emit({
                    id: uuid_1.v4(),
                    data: {
                        type: '_eventstore.EventReplayRequested',
                        event_type: pattern,
                        event_namespace: '_eventstore',
                        requested_event_namespace: event_namespace,
                        requested_event_type: event_type,
                        since: last.map((l) => l.context.time).getOrElse(new Date(0).toISOString()),
                    },
                    context: {
                        actor: {},
                        time: new Date().toISOString(),
                    },
                });
            });
        }
        function handleEventReplay(event) {
            return __awaiter(this, void 0, void 0, function* () {
                const events = store.readEventSince(event.data.event_type, funfix_1.Option.of(event.data.since));
                // Emit all events;
                reduce(events, funfix_1.None, (acc, e) => __awaiter(this, void 0, void 0, function* () {
                    yield emitter.emit(e);
                    return funfix_1.None;
                }));
            });
        }
        // DEPRECATED: This should listen for `eventstore.EventReplayRequested`
        // TODO: Delete this listener
        emitter.subscribe('EventReplayRequested', handleEventReplay);
        emitter.subscribe('_eventstore.EventReplayRequested', handleEventReplay);
        return {
            createAggregate,
            listen,
            save,
        };
    });
}
exports.newEventStore = newEventStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUVBLG1DQUFtRTtBQUNuRSxtQ0FBb0M7QUFDcEMsK0JBQTBCO0FBQzFCLHFDQUF1RDtBQUE5QyxnQ0FBQSxXQUFXLENBQUE7QUFBRSxrQ0FBQSxhQUFhLENBQUE7QUFFbkMsZ0NBQTJCO0FBQzNCLHlDQUE4RTtBQUU5RSxTQUFzQixNQUFNLENBQzFCLElBQXNCLEVBQ3RCLEdBQU0sRUFDTixDQUFrQzs7UUFFbEMsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2YsT0FBTyxJQUFJLEVBQUU7WUFDWCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNoQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7Z0JBQ2QsT0FBTyxJQUFJLENBQUM7YUFDYjtpQkFBTTtnQkFDTCxJQUFJLEdBQUcsTUFBTSxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQzthQUNuQztTQUNGO0lBQ0gsQ0FBQztDQUFBO0FBZEQsd0JBY0M7QUFJRDs7O0dBR0c7QUFDSCxTQUFnQixpQkFBaUIsQ0FBSSxPQUE0QjtJQUMvRCxPQUFPLENBQU8sR0FBYyxFQUFFLEtBQTRCLEVBQUUsRUFBRTtRQUM1RCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRTtZQUN0RCxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2pDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ1YsQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBVEQsOENBU0M7QUFF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