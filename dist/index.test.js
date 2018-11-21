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
const ava_1 = require("ava");
const _1 = require(".");
const sinon_1 = require("sinon");
const funfix_1 = require("funfix");
const pino = require("pino");
const test_helpers_1 = require("./test-helpers");
const logger = pino();
logger.level = 'fatal';
function toAsyncIter(input) {
    let idx = 0;
    return {
        next: () => __awaiter(this, void 0, void 0, function* () {
            idx++;
            if (idx > input.length) {
                return { done: true };
            }
            else {
                return { value: input[idx - 1], done: false };
            }
        }),
    };
}
function newEvent(data) {
    return {
        id: test_helpers_1.id,
        data,
        context: {
            time: new Date().toISOString(),
        },
    };
}
ava_1.default('Test composeAggregator one match', (t) => __awaiter(this, void 0, void 0, function* () {
    const validate = sinon_1.stub();
    validate.returns(true);
    const logic = sinon_1.stub();
    logic.resolves(funfix_1.Some('test'));
    const matches = [[validate, logic]];
    const aggregator = _1.composeAggregator(matches);
    t.deepEqual(typeof aggregator, 'function');
    t.deepEqual(yield aggregator(funfix_1.None, newEvent({ type: 'test' })), funfix_1.Some('test'));
}));
ava_1.default('Test composeAggregator no matches', (t) => __awaiter(this, void 0, void 0, function* () {
    const matches = [];
    const aggregator = _1.composeAggregator(matches);
    t.deepEqual(typeof aggregator, 'function');
    t.deepEqual(yield aggregator(funfix_1.None, newEvent({ type: 'test' })), funfix_1.None);
}));
ava_1.default('Test composeAggregator one no matching match', (t) => __awaiter(this, void 0, void 0, function* () {
    const validate = sinon_1.stub();
    validate.returns(false);
    const logic = sinon_1.stub();
    logic.resolves(funfix_1.Some('test'));
    const matches = [[validate, logic]];
    const aggregator = _1.composeAggregator(matches);
    t.deepEqual(typeof aggregator, 'function');
    t.deepEqual(yield aggregator(funfix_1.None, newEvent({ type: 'test' })), funfix_1.None);
}));
ava_1.default('Iter reducer', (t) => __awaiter(this, void 0, void 0, function* () {
    const executor = sinon_1.stub();
    executor.resolves(3);
    const iter = toAsyncIter([1, 2]);
    yield _1.reduce(iter, 0, executor);
    t.deepEqual(executor.callCount, 2);
    const args1 = executor.getCall(0).args;
    t.deepEqual(args1[0], 0); // Default accumulator
    t.deepEqual(args1[1], 1);
    const args2 = executor.getCall(1).args;
    t.deepEqual(args2[0], 3); // Executor returned in previous step
    t.deepEqual(args2[1], 2);
}));
ava_1.default('createAggregate returns none when no cache and no events', (t) => __awaiter(this, void 0, void 0, function* () {
    const readStub = sinon_1.stub();
    const store = {
        read: readStub,
    };
    readStub.returns(toAsyncIter([]));
    const es = yield _1.newEventStore(store, { logger });
    const matches = [[() => true, () => 'test']];
    const agg = es.createAggregate('Test', '*', matches);
    t.deepEqual(yield agg(), funfix_1.None);
}));
ava_1.default('createAggregate throws when the internal aggregate crashes', (t) => __awaiter(this, void 0, void 0, function* () {
    const readStub = sinon_1.stub();
    const store = {
        read: readStub,
    };
    readStub.returns(toAsyncIter([1]));
    const es = yield _1.newEventStore(store, { logger });
    const scrochedAggregation = () => {
        throw new Error('Scronched');
    };
    const matches = [[() => true, scrochedAggregation]];
    const agg = es.createAggregate('Test', '*', matches);
    try {
        yield agg();
        t.fail('This should throw an error');
    }
    catch (err) {
        if (err instanceof Error) {
            t.deepEqual(err.message, 'Scronched');
        }
        else {
            t.fail('Unexpected error');
        }
    }
}));
ava_1.default('save emits if everything is fine', (t) => __awaiter(this, void 0, void 0, function* () {
    const writeStub = sinon_1.stub();
    writeStub.resolves(funfix_1.Right(undefined));
    const store = {
        write: writeStub,
    };
    const emitStub = sinon_1.stub();
    emitStub.resolves();
    const emitter = { emit: emitStub, subscribe: () => Promise.resolve() };
    const es = yield _1.newEventStore(store, { logger, emitter });
    yield es.save({ id: '', data: { type: 'test' }, context: { time: '', subject: {} } });
    t.deepEqual(writeStub.callCount, 1);
    t.deepEqual(emitStub.callCount, 1);
}));
ava_1.default('save does not emit on errors', (t) => __awaiter(this, void 0, void 0, function* () {
    const writeStub = sinon_1.stub();
    writeStub.resolves(funfix_1.Left(new Error('Boom')));
    const store = {
        write: writeStub,
    };
    const emitStub = sinon_1.stub();
    emitStub.resolves();
    const emitter = { emit: emitStub, subscribe: () => Promise.resolve() };
    const es = yield _1.newEventStore(store, { logger, emitter });
    try {
        yield es.save({ id: '', data: { type: 'test' }, context: { time: '', subject: {} } });
        t.fail('On write errors save should reject');
    }
    catch (err) {
        if (err instanceof Error) {
            t.deepEqual(err.message, 'Boom');
            t.deepEqual(writeStub.callCount, 1);
            t.deepEqual(emitStub.callCount, 0);
        }
        else {
            t.fail('The catch object should be an error');
        }
    }
}));
ava_1.default('save does not emit on duplicates', (t) => __awaiter(this, void 0, void 0, function* () {
    const writeStub = sinon_1.stub();
    writeStub.resolves(funfix_1.Left(new _1.DuplicateError()));
    const store = {
        write: writeStub,
    };
    const emitStub = sinon_1.stub();
    emitStub.resolves();
    const emitter = { emit: emitStub, subscribe: () => Promise.resolve() };
    const es = yield _1.newEventStore(store, { logger, emitter });
    yield es.save({ id: '', data: { type: 'test' }, context: { time: '', subject: {} } });
    t.deepEqual(writeStub.callCount, 1);
    t.deepEqual(emitStub.callCount, 0);
}));
ava_1.default('replay handler reads correct events', (t) => __awaiter(this, void 0, void 0, function* () {
    const readSpy = sinon_1.stub().returns(test_helpers_1.createFakeIterator([]));
    const since = new Date().toISOString();
    const emit = sinon_1.spy();
    const store = yield test_helpers_1.getFakeStoreAdapter({ readSinceStub: readSpy });
    const emitter = {
        emit: emit,
    };
    const replayHandler = _1.createEventReplayHandler({ store, emitter });
    const evt = {
        id: test_helpers_1.id,
        data: {
            type: '_eventstore.EventReplayRequested',
            event_namespace: '_eventstore',
            event_type: 'EventReplayRequested',
            requested_event_namespace: 'ns',
            requested_event_type: 'SomeType',
            since,
        },
        context: { subject: {}, time: '' },
    };
    replayHandler(evt);
    t.truthy(readSpy.calledWithExactly('ns.SomeType', funfix_1.Some(since)));
}));
ava_1.default('listen emits EventReplayRequested without existing events', (t) => __awaiter(this, void 0, void 0, function* () {
    const handler = sinon_1.stub();
    const emit = sinon_1.spy();
    const subscribe = sinon_1.spy();
    const store = yield test_helpers_1.getFakeStoreAdapter({});
    const emitter = {
        emit: emit,
        subscribe: subscribe,
    };
    const es = yield _1.newEventStore(store, { logger, emitter });
    const namespc = 't';
    const evtype = 'event_type';
    yield es.listen(namespc, evtype, handler);
    const event = emit.firstCall.args[0];
    t.deepEqual(event.data.type, `_eventstore.EventReplayRequested`);
    t.deepEqual(event.data.requested_event_namespace, namespc);
    t.deepEqual(event.data.requested_event_type, evtype);
    t.deepEqual(event.data.since, new Date(0).toISOString());
}));
ava_1.default('listen emits EventReplayRequested with existing events', (t) => __awaiter(this, void 0, void 0, function* () {
    const handler = sinon_1.stub();
    const emit = sinon_1.spy();
    const subscribe = sinon_1.spy();
    const lastEventOf = sinon_1.stub();
    const existingEvent = _1.createEvent('test', 'Existing', {});
    lastEventOf.resolves(funfix_1.Some(existingEvent));
    const store = yield test_helpers_1.getFakeStoreAdapter({ lastEventOf });
    const emitter = {
        emit: emit,
        subscribe: subscribe,
    };
    const es = yield _1.newEventStore(store, { logger, emitter });
    const namespc = 't';
    const evtype = 'event_type';
    yield es.listen(namespc, evtype, handler);
    const event = emit.firstCall.args[0];
    t.deepEqual(event.data.type, `_eventstore.EventReplayRequested`);
    t.deepEqual(event.data.requested_event_namespace, namespc);
    t.deepEqual(event.data.requested_event_type, evtype);
    t.deepEqual(event.data.since, existingEvent.context.time);
}));
ava_1.default('listen calls handler if event doesnt exist and saves after its execution', (t) => __awaiter(this, void 0, void 0, function* () {
    const handler = sinon_1.stub();
    handler.resolves(funfix_1.Right(undefined));
    const emit = sinon_1.spy();
    const subscribe = sinon_1.spy();
    const exists = sinon_1.stub().resolves(false);
    const saveStub = sinon_1.stub();
    const store = yield test_helpers_1.getFakeStoreAdapter({ exists, saveStub });
    const emitter = {
        emit: emit,
        subscribe: subscribe,
    };
    const es = yield _1.newEventStore(store, { logger, emitter });
    const namespc = 't';
    const evtype = 'event_type';
    yield es.listen(namespc, evtype, handler);
    t.deepEqual(subscribe.secondCall.args[0], `${namespc}.${evtype}`);
    const wrapped_handler = subscribe.secondCall.args[1];
    const event = _1.createEvent('test', 'event', {});
    yield wrapped_handler(event);
    t.true(exists.calledWith(event.id));
    t.true(handler.calledOnce);
    t.true(saveStub.calledWith(event));
}));
ava_1.default('listen calls does not save event if handler fails', (t) => __awaiter(this, void 0, void 0, function* () {
    const handler = sinon_1.stub();
    handler.resolves(funfix_1.Left(undefined));
    const emit = sinon_1.spy();
    const subscribe = sinon_1.spy();
    const exists = sinon_1.stub().resolves(false);
    const saveStub = sinon_1.stub();
    const store = yield test_helpers_1.getFakeStoreAdapter({ exists, saveStub });
    const emitter = {
        emit: emit,
        subscribe: subscribe,
    };
    const es = yield _1.newEventStore(store, { logger, emitter });
    const namespc = 't';
    const evtype = 'event_type';
    yield es.listen(namespc, evtype, handler);
    t.deepEqual(subscribe.secondCall.args[0], `${namespc}.${evtype}`);
    const wrapped_handler = subscribe.secondCall.args[1];
    const event = _1.createEvent('test', 'event', {});
    yield wrapped_handler(event);
    t.true(exists.calledWith(event.id));
    t.true(handler.calledOnce);
    t.true(saveStub.notCalled);
}));
ava_1.default('listen does not call handler if event already exists and does not save event', (t) => __awaiter(this, void 0, void 0, function* () {
    const handler = sinon_1.stub();
    handler.resolves(funfix_1.Right(undefined));
    const emit = sinon_1.spy();
    const subscribe = sinon_1.spy();
    const exists = sinon_1.stub().resolves(true);
    const saveStub = sinon_1.stub();
    const store = yield test_helpers_1.getFakeStoreAdapter({ exists, saveStub });
    const emitter = {
        emit: emit,
        subscribe: subscribe,
    };
    const es = yield _1.newEventStore(store, { logger, emitter });
    const namespc = 't';
    const evtype = 'event_type';
    yield es.listen(namespc, evtype, handler);
    t.deepEqual(subscribe.secondCall.args[0], `${namespc}.${evtype}`);
    const wrapped_handler = subscribe.secondCall.args[1];
    const event = _1.createEvent('test', 'event', {});
    yield wrapped_handler(event);
    t.true(exists.calledWith(event.id));
    t.true(handler.notCalled);
    t.true(saveStub.notCalled);
}));
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw2QkFBdUI7QUFDdkIsd0JBY1c7QUFDWCxpQ0FBa0M7QUFDbEMsbUNBQWlEO0FBRWpELDZCQUE2QjtBQUM3QixpREFBNkU7QUFFN0UsTUFBTSxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUM7QUFDdEIsTUFBTSxDQUFDLEtBQUssR0FBRyxPQUFPLENBQUM7QUFFdkIsU0FBUyxXQUFXLENBQUksS0FBVTtJQUNoQyxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDWixPQUFPO1FBQ0wsSUFBSSxFQUFFLEdBQXVCLEVBQUU7WUFDN0IsR0FBRyxFQUFFLENBQUM7WUFDTixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsTUFBTSxFQUFFO2dCQUN0QixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7YUFDL0M7UUFDSCxDQUFDLENBQUE7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELFNBQVMsUUFBUSxDQUFDLElBQWU7SUFDL0IsT0FBTztRQUNMLEVBQUUsRUFBRixpQkFBRTtRQUNGLElBQUk7UUFDSixPQUFPLEVBQUU7WUFDUCxJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDL0I7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELGFBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFPLENBQUMsRUFBRSxFQUFFO0lBQ25ELE1BQU0sUUFBUSxHQUFRLFlBQUksRUFBRSxDQUFDO0lBQzdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsTUFBTSxLQUFLLEdBQVEs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