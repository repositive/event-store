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
const funfix_1 = require("funfix");
const iris_1 = require("@repositive/iris");
function wait(n) {
    return new Promise((resolve, reject) => {
        setTimeout(() => resolve, n);
    });
}
exports.wait = wait;
function wrapHandler(handler, logger) {
    return function ({ payload }) {
        logger.trace('receivedEvent', { payload });
        return handler(payload);
    };
}
function createAQMPEmitterAdapter(irisOpts, logger = console) {
    let iris = funfix_1.None;
    const subscriptions = new Map();
    iris_1.default(Object.assign({}, irisOpts, { logger }))
        .map((_iris) => {
        iris = funfix_1.Some(_iris);
        for (const [pattern, handler] of subscriptions.entries()) {
            _iris.register({ pattern, handler: wrapHandler(handler, logger) });
        }
    })
        .subscribe();
    function emit(event) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.trace('emitEvent', { event });
            yield iris
                .map((i) => i.emit({ pattern: event.data.type, payload: event }))
                .getOrElseL(() => wait(1000).then(() => emit(event)));
        });
    }
    function subscribe(pattern, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            const _handler = wrapHandler(handler, logger);
            logger.trace('subscribeToEvent', { pattern, hasIris: iris.nonEmpty() });
            yield iris
                .map((i) => {
                logger.trace('subscribeToEventHasIris', { pattern });
                i.register({ pattern, handler: _handler });
                subscriptions.set(pattern, handler);
            })
                .getOrElseL(() => {
                const wait_time = 100;
                logger.trace('subscribeToEventNoIris', { pattern, wait_time });
                // return wait(wait_time).then(() => {
                //   logger.trace('subscribeToEventReAttempt', { pattern });
                subscribe(pattern, handler);
                // })
            });
        });
    }
    return {
        emit,
        subscribe,
    };
}
exports.createAQMPEmitterAdapter = createAQMPEmitterAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1xcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9lbWl0dGVyL2FtcXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVVBLG1DQUE0QztBQUM1QywyQ0FBeUM7QUFRekMsU0FBZ0IsSUFBSSxDQUFDLENBQVM7SUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUpELG9CQUlDO0FBRUQsU0FBUyxXQUFXLENBQUMsT0FBNEIsRUFBRSxNQUFjO0lBQy9ELE9BQU8sVUFBUyxFQUFFLE9BQU8sRUFBcUI7UUFDNUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQyxDQUFDO1FBRTNDLE9BQU8sT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQzFCLENBQUMsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQix3QkFBd0IsQ0FDdEMsUUFBcUIsRUFDckIsU0FBaUIsT0FBTztJQUV4QixJQUFJLElBQUksR0FBaUIsYUFBSSxDQUFDO0lBQzlCLE1BQU0sYUFBYSxHQUdmLElBQUksR0FBRyxFQUFFLENBQUM7SUFDZCxjQUFTLG1CQUFNLFFBQVEsSUFBRSxNQUFNLElBQUc7U0FDL0IsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDYixJQUFJLEdBQUcsYUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25CLEtBQUssTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDeEQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLE9BQU8sRUFBRSxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDcEU7SUFDSCxDQUFDLENBQUM7U0FDRCxTQUFTLEVBQUUsQ0FBQztJQUVmLFNBQWUsSUFBSSxDQUFDLEtBQTBDOztZQUM1RCxNQUFNLENBQUMsS0FBSyxDQUFDLFdBQVcsRUFBRSxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7WUFFckMsTUFBTSxJQUFJO2lCQUNQLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDaEUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQUE7SUFFRCxTQUFlLFNBQVMsQ0FDdEIsT0FBOEIsRUFDOUIsT0FBNEI7O1lBRTVCLE1BQU0sUUFBUSxHQUFHLFdBQVcsQ0FBQyxPQUFPLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFFOUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsSUFBSSxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztZQUV4RSxNQUFNLElBQUk7aUJBQ1AsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7Z0JBQ1QsTUFBTSxDQUFDLEtBQUssQ0FBQyx5QkFBeUIsRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDLENBQUM7Z0JBRXJELENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBRTNDLGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO1lBQ3RDLENBQUMsQ0FBQztpQkFDRCxVQUFVLENBQUMsR0FBRyxFQUFFO2dCQUNmLE1BQU0sU0FBUyxHQUFHLEdBQUcsQ0FBQztnQkFFdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyx3QkFBd0IsRUFBRSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsQ0FBQyxDQUFDO2dCQUUvRCxzQ0FBc0M7Z0JBQ3RDLDREQUE0RDtnQkFFMUQsU0FBUyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztnQkFDOUIsS0FBSztZQUNQLENBQUMsQ0FBQyxDQUFDO1FBQ1AsQ0FBQztLQUFBO0lBRUQsT0FBTztRQUNMLElBQUk7UUFDSixTQUFTO0tBQ1YsQ0FBQztBQUNKLENBQUM7QUEzREQsNERBMkRDIn0=