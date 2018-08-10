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
function newEventStore(store, cache, emitter, logger = console) {
    return __awaiter(this, void 0, void 0, function* () {
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
                            logger.trace('save to cache', result);
                            return cache.set(id, { data: result, time: aggregatedAt.toISOString() });
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUVBLG1DQUE4QztBQUM5QyxtQ0FBb0M7QUFDcEMsK0JBQTBCO0FBRTFCLGdDQUEyQjtBQUUzQixTQUFlLE1BQU0sQ0FBTyxJQUFzQixFQUFFLEdBQU0sRUFBRSxDQUFrQzs7UUFDNUYsSUFBSSxJQUFJLEdBQUcsR0FBRyxDQUFDO1FBQ2YsSUFBSTtZQUNGLE9BQU8sSUFBSSxFQUFFO2dCQUNYLE1BQU0sS0FBSyxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUNoQyxJQUFJLEtBQUssQ0FBQyxJQUFJLEVBQUU7b0JBQ2QsT0FBTyxJQUFJLENBQUM7aUJBQ2I7cUJBQU07b0JBQ0wsSUFBSSxHQUFHLE1BQU0sQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7aUJBQ25DO2FBQ0Y7U0FDRjtRQUFDLE9BQU8sS0FBSyxFQUFFO1lBQ2QsT0FBTyxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQzlCO0lBQ0gsQ0FBQztDQUFBO0FBRUQsU0FBZ0IsT0FBTyxDQUNyQixTQUE2QixDQUFDLENBQU0sRUFBWSxFQUFFLENBQUMsSUFBSSxFQUN2RCxZQUFnQyxDQUFDLENBQU0sRUFBWSxFQUFFLENBQUMsSUFBSTtJQUUxRCxPQUFPLFVBQVMsQ0FBTTtRQUNwQixPQUFRLENBQUM7WUFDRCxPQUFPLENBQUMsQ0FBQyxFQUFFLEtBQUssUUFBUTtZQUN4QixDQUFDLENBQUMsSUFBSTtZQUNOLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ2QsQ0FBQyxDQUFDLE9BQU87WUFDVCxTQUFTLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQztBQUNKLENBQUM7QUFaRCwwQkFZQztBQTBFRCxTQUFzQixhQUFh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