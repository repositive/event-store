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
                yield store.write(event);
                yield emitter.emit(event);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUVBLG1DQUE4QztBQUM5QyxtQ0FBb0M7QUFDcEMsK0JBQTBCO0FBRTFCLGdDQUEyQjtBQUMzQix5Q0FBNEU7QUFFNUUsU0FBc0IsTUFBTSxDQUFPLElBQXNCLEVBQUUsR0FBTSxFQUFFLENBQWtDOztRQUNuRyxJQUFJLElBQUksR0FBRyxHQUFHLENBQUM7UUFDZixPQUFPLElBQUksRUFBRTtZQUNYLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO1lBQ2hDLElBQUksS0FBSyxDQUFDLElBQUksRUFBRTtnQkFDZCxPQUFPLElBQUksQ0FBQzthQUNiO2lCQUFNO2dCQUNMLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2FBQ25DO1NBQ0Y7SUFDSCxDQUFDO0NBQUE7QUFWRCx3QkFVQztBQUlEOzs7R0FHRztBQUNILFNBQWdCLGlCQUFpQixDQUMvQixPQUE0QjtJQUU1QixPQUFPLENBQU8sR0FBYyxFQUFFLEtBQTRCLEVBQUUsRUFBRTtRQUMxRCxPQUFPLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsRUFBRTtZQUN0RCxJQUFJLFFBQVEsQ0FBQyxLQUFLLENBQUMsRUFBRTtnQkFDbkIsT0FBTyxPQUFPLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQyxDQUFDO2FBQ2pDO1lBQ0QsT0FBTyxRQUFRLENBQUM7UUFDbEIsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDO0lBQ1osQ0FBQyxDQUFBLENBQUM7QUFDSixDQUFDO0FBWEQsOENBV0M7QUFFRCxTQUFnQixPQUFPLENBQ3JCLFNBQTZCLENBQUMsQ0FBTSxFQUFZLEVBQUUsQ0FBQyxJQUFJLEVB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