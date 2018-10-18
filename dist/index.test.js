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
const uuid_1 = require("uuid");
const pino = require("pino");
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
    const id = uuid_1.v4();
    return {
        id,
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
    logic.resolves(funfix_1.Some("test"));
    const matches = [
        [validate, logic],
    ];
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
    logic.resolves(funfix_1.Some("test"));
    const matches = [
        [validate, logic],
    ];
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXgudGVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uL3NyYy9pbmRleC50ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSw2QkFBdUI7QUFDdkIsd0JBQXdGO0FBQ3hGLGlDQUE2QjtBQUM3QixtQ0FBb0M7QUFDcEMsK0JBQWtDO0FBQ2xDLDZCQUE2QjtBQUU3QixNQUFNLE1BQU0sR0FBRyxJQUFJLEVBQUUsQ0FBQztBQUN0QixNQUFNLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztBQUV2QixTQUFTLFdBQVcsQ0FBSSxLQUFVO0lBQ2hDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUNaLE9BQU87UUFDTCxJQUFJLEVBQUUsR0FBdUIsRUFBRTtZQUM3QixHQUFHLEVBQUUsQ0FBQztZQUNOLElBQUksR0FBRyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUU7Z0JBQ3RCLE9BQU8sRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLENBQUM7YUFDdkI7aUJBQU07Z0JBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxLQUFLLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQzthQUMvQztRQUNILENBQUMsQ0FBQTtLQUNGLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBUyxRQUFRLENBQUMsSUFBZTtJQUMvQixNQUFNLEVBQUUsR0FBRyxTQUFJLEVBQUUsQ0FBQztJQUVsQixPQUFPO1FBQ0wsRUFBRTtRQUNGLElBQUk7UUFDSixPQUFPLEVBQUc7WUFDUixJQUFJLEVBQUUsSUFBSSxJQUFJLEVBQUUsQ0FBQyxXQUFXLEVBQUU7U0FDL0I7S0FDRixDQUFDO0FBQ0osQ0FBQztBQUVELGFBQUksQ0FBQyxrQ0FBa0MsRUFBRSxDQUFPLENBQUMsRUFBRSxFQUFFO0lBQ25ELE1BQU0sUUFBUSxHQUFRLFlBQUksRUFBRSxDQUFDO0lBQzdCLFFBQVEsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7SUFDdkIsTUFBTSxLQUFLLEdBQVEsWUFBSSxFQUFFLENBQUM7SUFDMUIsS0FBSyxDQUFDLFFBQVEsQ0FBQyxhQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQztJQUM3QixNQUFNLE9BQU8sR0FBNkI7UUFDeEMsQ0FBQyxRQUFRLEVBQUUsS0FBSyxDQUFDO0tBQ2xCLENBQUM7SUFFRixNQUFNLFVBQVUsR0FBRyxvQkFBaUIsQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM5QyxDQUFDLENBQUMsU0FBUyxDQUFDLE9BQU8sVUFBVSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQzNDLENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxVQUFVLENBQUMsYUFBSSxFQUFFLFFBQVEsQ0FBQyxFQUFDLElBQUksRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLEVBQUUsYUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDOUUsQ0FBQyxDQUFBLENBQUMsQ0FBQztBQUVILGFBQUksQ0FBQyxtQ0FBbUMsRUFBRSxDQUFPLENBQUMsRUFBRSxFQUFFO0lBQ3BELE1BQU0sT0FBTyxHQUE2QixFQUFFLENBQUM7SUFFN0MsTUFBTSxVQUFVLEdBQUcsb0JBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sVUFBVSxDQUFDLGFBQUksRUFBRSxRQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQyxFQUFFLGFBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCxhQUFJLENBQUMsOENBQThDLEVBQUUsQ0FBTyxDQUFDLEVBQUUsRUFBRTtJQUMvRCxNQUFNLFFBQVEsR0FBUSxZQUFJLEVBQUUsQ0FBQztJQUM3QixRQUFRLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQ3hCLE1BQU0sS0FBSyxHQUFRLFlBQUksRUFBRSxDQUFDO0lBQzFCLEtBQUssQ0FBQyxRQUFRLENBQUMsYUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDN0IsTUFBTSxPQUFPLEdBQTZCO1FBQ3hDLENBQUMsUUFBUSxFQUFFLEtBQUssQ0FBQztLQUNsQixDQUFDO0lBRUYsTUFBTSxVQUFVLEdBQUcsb0JBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDOUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxPQUFPLFVBQVUsRUFBRSxVQUFVLENBQUMsQ0FBQztJQUMzQyxDQUFDLENBQUMsU0FBUyxDQUFDLE1BQU0sVUFBVSxDQUFDLGFBQUksRUFBRSxRQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsTUFBTSxFQUFDLENBQUMsQ0FBQyxFQUFFLGFBQUksQ0FBQyxDQUFDO0FBQ3RFLENBQUMsQ0FBQSxDQUFDLENBQUM7QUFFSCxhQUFJLENBQUMsY0FBYyxFQUFFLENBQU8sQ0FBQyxFQUFFLEVBQUU7SUFDL0IsTUFBTSxRQUFRLEdBQUcsWUFBSSxFQUFFLENBQUM7SUFDeEIsUUFBUSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQixNQUFNLElBQUksR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUVqQyxNQUFNLFNBQU0sQ0FBQyxJQUFJLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxDQUFDO0lBRWhDLENBQUMsQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLFNBQVMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVuQyxNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN2QyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHNCQUFzQjtJQUNoRCxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUV6QixNQUFNLEtBQUssR0FBRyxRQUFRLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztJQUN2QyxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLHFDQUFxQztJQUMvRCxDQUFDLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztBQUMzQixDQUFDLENBQUEsQ0FBQyxDQUFDO0FBRUgsYUFBSSxDQUFDLDBEQUEwRCxFQUFFLENBQU8sQ0FBQyxFQUFFLEVBQUU7SUFDM0UsTUFBTSxRQUFRLEdBQUcsWUFBSSxFQUFFLENBQUM7SUFDeEIsTUFBTSxLQUFLLEdBQVE7UUFDakIsSUFBSSxFQUFFLFFBQVE7S0FDZixDQUFDO0lBRUYsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQztJQUVsQyxNQUFNLEVBQUUsR0FBRyxNQUFNLGdCQUFhLENBQUMsS0FBSyxFQUFFLEVBQUMsTUFBTSxFQUFDLENBQUMsQ0FBQztJQUVoRCxNQUFNLE9BQU8sR0FBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7SUFDbEQsTUFBTSxHQUFHLEdBQUcsRUFBRSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3JELENBQUMsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxhQUFJLENBQUMsQ0FBQztBQUNqQyxDQUFDLENBQUEsQ0FBQyxDQUFDO0FBRUgsYUFBSSxDQUFDLDREQUE0RCxFQUFFLENBQU8sQ0FBQyxFQUFFLEVBQUU7SUFFN0UsTUFBTSxRQUFRLEdBQUcsWUFBSSxFQUFFLENBQUM7SUFDeEIsTUFBTSxLQUFLLEdBQVE7UUFDakIsSUFBSSxFQUFFLFFBQVE7S0FDZixDQUFDO0lBRUYsUUFBUSxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFbkMsTUFBTSxFQUFFLEdBQUcsTUFBTSxnQkFBYSxDQUFDLEtBQUssRUFBRSxFQUFDLE1BQU0sRUFBQyxDQUFDLENBQUM7SUFFaEQsTUFBTSxtQkFBbUIsR0FBRyxHQUFHLEVBQUU7UUFDL0IsTUFBTSxJQUFJLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQztJQUMvQixDQUFDLENBQUM7SUFDRixNQUFNLE9BQU8sR0FBUSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLG1CQUFtQixDQUFDLENBQUMsQ0FBQztJQUN6RCxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxHQUFHLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFFckQsSUFBSTtRQUNGLE1BQU0sR0FBRyxFQUFFLENBQUM7UUFDWixDQUFDLENBQUMsSUFBSSxDQUFDLDRCQUE0QixDQUFDLENBQUM7S0FDdEM7SUFBQyxPQUFPLEdBQUcsRUFBRTtRQUNaLElBQUksR0FBRyxZQUFZLEtBQUssRUFBRTtZQUN4QixDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsV0FBVyxDQUFDLENBQUM7U0FDdkM7YUFBTTtZQUNMLENBQUMsQ0FBQyxJQUFJLENBQUMsa0JBQWtCLENBQUMsQ0FBQztTQUM1QjtLQUNGO0FBQ0gsQ0FBQyxDQUFBLENBQUMsQ0FBQyJ9