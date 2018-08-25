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
                        .update(JSON.stringify(query) + JSON.stringify(args))
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