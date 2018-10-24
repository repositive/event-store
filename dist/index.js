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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUVBLG1DQUFtRTtBQUNuRSxtQ0FBb0M7QUFDcEMsK0JBQTBCO0FBQzFCLHFDQUF1RDtBQUE5QyxnQ0FBQSxXQUFXLENBQUE7QUFBRSxrQ0FBQSxhQUFhLENBQUE7QUFFbkMsZ0NBQTJCO0FBQzNCLHlDQUE0RTtBQUU1RSxTQUFzQixNQUFNLENBQU8sSUFBc0IsRUFBRSxHQUFNLEVBQUUsQ0FBa0M7O1FBQ25HLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNmLE9BQU8sSUFBSSxFQUFFO1lBQ1gsTUFBTSxLQUFLLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7WUFDaEMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO2dCQUNkLE9BQU8sSUFBSSxDQUFDO2FBQ2I7aUJBQU07Z0JBQ0wsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDbkM7U0FDRjtJQUNILENBQUM7Q0FBQTtBQVZELHdCQVVDO0FBSUQ7OztHQUdHO0FBQ0gsU0FBZ0IsaUJBQWlCLENBQy9CLE9BQTRCO0lBRTVCLE9BQU8sQ0FBTyxHQUFjLEVBQUUsS0FBNEIsRUFBRSxFQUFFO1FBQzFELE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRSxFQUFFO1lBQ3RELElBQUksUUFBUSxDQUFDLEtBQUssQ0FBQyxFQUFFO2dCQUNuQixPQUFPLE9BQU8sQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDLENBQUM7YUFDakM7WUFDRCxPQUFPLFFBQVEsQ0FBQztRQUNsQixDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUM7SUFDWixDQUFDLENBQUEsQ0FBQztBQUNKLENBQUM7QUFYRCw4Q0FXQztBQUVE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