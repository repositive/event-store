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
        return o &&
            typeof o.id === 'string' &&
            o.data &&
            isData(o.data) &&
            o.context &&
            isContext(o.context);
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
                    return result.map(() => {
                        // If there are no errors saving, emit the event
                        return emitter.emit(event);
                    })
                        .getOrElseL(() => {
                        return result.swap().map((error) => {
                            if (error instanceof DuplicateError) {
                                return Promise.resolve();
                            }
                            return Promise.reject(error);
                        }).get();
                    });
                });
            });
        }
        function listen(pattern, handler) {
            return __awaiter(this, void 0, void 0, function* () {
                emitter.subscribe(pattern, handler);
                const last = yield store.lastEventOf(pattern);
                emitter
                    .emit({
                    id: uuid_1.v4(),
                    data: {
                        type: 'EventReplayRequested',
                        event_type: pattern,
                        since: last.map((l) => l.context.time).getOrElse(new Date(0).toISOString()),
                    },
                    context: {
                        actor: {},
                        time: new Date().toISOString(),
                    },
                });
            });
        }
        emitter.subscribe('EventReplayRequested', (event) => __awaiter(this, void 0, void 0, function* () {
            const events = store.readEventSince(event.data.event_type, funfix_1.Option.of(event.data.since));
            // Emit all events;
            reduce(events, funfix_1.None, (acc, e) => __awaiter(this, void 0, void 0, function* () {
                yield emitter.emit(e);
                return funfix_1.None;
            }));
        }));
        return {
            createAggregate,
            listen,
            save,
        };
    });
}
exports.newEventStore = newEventStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUVBLG1DQUFtRTtBQUNuRSxtQ0FBb0M7QUFDcEMsK0JBQTBCO0FBRTFCLGdDQUEyQjtBQUMzQix5Q0FBNEU7QUFFNUUsU0FBc0IsTUFBTSxDQUFPLElBQXNCLEVBQUUsR0FBTSxFQUFFLENBQWtDOztRQUNuRyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUM7UUFDZixPQUFPLElBQUksRUFBRTtZQUNYLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hDLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDZCxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNO2dCQUNMLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ25DO1NBQ0Y7SUFDSCxDQUFDO0NBQUE7QUFWRCx3QkFVQztBQUlEOzs7R0FHRztBQUNILFNBQWdCLGlCQUFpQixDQUMvQixPQUE0QjtJQUU1QixPQUFPLENBQU8sR0FBYyxFQUFFLEtBQTRCLEVBQUUsRUFBRTtRQUMxRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRTtZQUN0RCxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2pDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBWEQsOENBV0M7QUFFRCxTQUFnQixPQUFPLENBQ3JCLFNBQTZCLENBQUMsQ0FBTSxFQUFZLEVBQUUsQ0FBQyxJQUFJLEVB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