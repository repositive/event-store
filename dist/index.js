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
        try {
            while (true) {
                const _next = yield iter.next();
                if (_next.done) {
                    return _acc;
                }
                else {
                    _acc = yield f(_acc, _next.value);
                }
            }
        }
        catch (error) {
            return Promise.reject(error);
        }
    });
}
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
                    try {
                        const latestSnapshot = yield cache.get(id);
                        logger.trace('cacheSnapshot', latestSnapshot);
                        const results = store.read(query, latestSnapshot.flatMap((snapshot) => funfix_1.Option.of(snapshot.time)), ...args);
                        const aggregatedAt = new Date();
                        const aggregatedResult = yield reduce(results, latestSnapshot.map((snapshot) => snapshot.data), (acc, event) => __awaiter(this, void 0, void 0, function* () {
                            return yield matches.reduce((matchAcc, [validate, execute]) => {
                                if (validate(event)) {
                                    return execute(matchAcc, event);
                                }
                                return matchAcc;
                            }, acc);
                        }));
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
                    }
                    catch (error) {
                        logger.error('errorOnReduction', error);
                        return Promise.reject(error);
                    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUVBLG1DQUE4QztBQUM5QyxtQ0FBb0M7QUFDcEMsK0JBQTBCO0FBRTFCLGdDQUEyQjtBQUMzQix5Q0FBNEU7QUFFNUUsU0FBZSxNQUFNLENBQU8sSUFBc0IsRUFBRSxHQUFNLEVBQUUsQ0FBa0M7O1FBQzVGLElBQUksSUFBSSxHQUFHLEdBQUcsQ0FBQztRQUNmLElBQUk7WUFDRixPQUFPLElBQUksRUFBRTtnQkFDWCxNQUFNLEtBQUssR0FBRyxNQUFNLElBQUksQ0FBQyxJQUFJLEVBQUUsQ0FBQztnQkFDaEMsSUFBSSxLQUFLLENBQUMsSUFBSSxFQUFFO29CQUNkLE9BQU8sSUFBSSxDQUFDO2lCQUNiO3FCQUFNO29CQUNMLElBQUksR0FBRyxNQUFNLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO2lCQUNuQzthQUNGO1NBQ0Y7UUFBQyxPQUFPLEtBQUssRUFBRTtZQUNkLE9BQU8sT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQztTQUM5QjtJQUNILENBQUM7Q0FBQTtBQUVELFNBQWdCLE9BQU8sQ0FDckIsU0FBNkIsQ0FBQyxDQUFNLEVBQVksRUFBRSxDQUFDLElBQUksRUFDdkQsWUFBZ0MsQ0FBQyxDQUFNLEVBQVksRUFBRSxDQUFDLElBQUk7SUFFMUQsT0FBTyxVQUFTLENBQU07UUFDcEIsT0FBUSxDQUFDO1lBQ0QsT0FBTyxDQUFDLENBQUMsRUFBRSxLQUFLLFFBQVE7WUFDeEIsQ0FBQyxDQUFDLElBQUk7WUFDTixNQUFNLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztZQUNkLENBQUMsQ0FBQyxPQUFPO1lBQ1QsU0FBUyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUM7QUFDSixDQUFDO0FBWkQsMEJBWUM7QUFn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