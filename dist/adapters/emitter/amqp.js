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
    return new Promise((resolve) => setTimeout(resolve, n));
}
exports.wait = wait;
function wrapHandler(handler) {
    return function ({ payload }) {
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
            _iris.register({ pattern, handler: wrapHandler(handler) });
        }
    })
        .subscribe();
    function emit(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return iris
                .map((i) => i.emit({ pattern: event.data.type, payload: event }))
                .getOrElseL(() => wait(1000).then(() => emit(event)));
        });
    }
    function subscribe(pattern, handler, _attempt = 0) {
        return __awaiter(this, void 0, void 0, function* () {
            logger.trace('amqpSubscribe', { pattern, _attempt });
            const _handler = wrapHandler(handler);
            subscriptions.set(pattern, handler);
            return iris.map((i) => {
                logger.trace('amqpSubscribeHasIris', { pattern, _attempt });
                return i.register({ pattern, handler: _handler });
            })
                .getOrElseL(() => __awaiter(this, void 0, void 0, function* () {
                const waitTime = 1000;
                logger.trace('amqpSubscribeNoIris', { pattern, _attempt, waitTime });
                yield wait(waitTime);
                logger.trace('amqpSubscribeRetry', { pattern, _attempt, waitTime });
                subscribe(pattern, handler, _attempt + 1);
            }));
        });
    }
    return {
        emit,
        subscribe,
    };
}
exports.createAQMPEmitterAdapter = createAQMPEmitterAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1xcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9lbWl0dGVyL2FtcXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQVVBLG1DQUE0QztBQUM1QywyQ0FBeUM7QUFRekMsU0FBZ0IsSUFBSSxDQUFDLENBQVM7SUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsVUFBVSxDQUFDLE9BQU8sRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzFELENBQUM7QUFGRCxvQkFFQztBQUVELFNBQVMsV0FBVyxDQUFDLE9BQTRCO0lBQy9DLE9BQU8sVUFBUyxFQUFFLE9BQU8sRUFBcUI7UUFDNUMsT0FBTyxPQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7SUFDMUIsQ0FBQyxDQUFDO0FBQ0osQ0FBQztBQUVELFNBQWdCLHdCQUF3QixDQUN0QyxRQUFxQixFQUNyQixTQUFpQixPQUFPO0lBRXhCLElBQUksSUFBSSxHQUFpQixhQUFJLENBQUM7SUFDOUIsTUFBTSxhQUFhLEdBR2YsSUFBSSxHQUFHLEVBQUUsQ0FBQztJQUNkLGNBQVMsbUJBQU0sUUFBUSxJQUFFLE1BQU0sSUFBRztTQUMvQixHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNiLElBQUksR0FBRyxhQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkIsS0FBSyxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUN4RCxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUUsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1NBQzVEO0lBQ0gsQ0FBQyxDQUFDO1NBQ0QsU0FBUyxFQUFFLENBQUM7SUFFZixTQUFlLElBQUksQ0FBQyxLQUEwQzs7WUFDNUQsT0FBTyxJQUFJO2lCQUNSLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztpQkFDaEUsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQUE7SUFFRCxTQUFlLFNBQVMsQ0FDdEIsT0FBOEIsRUFDOUIsT0FBNEIsRUFDNUIsUUFBUSxHQUFHLENBQUM7O1lBRVosTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUVyRCxNQUFNLFFBQVEsR0FBRyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7WUFFdEMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7WUFFcEMsT0FBTyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFnQixFQUFFO2dCQUNsQyxNQUFNLENBQUMsS0FBSyxDQUFDLHNCQUFzQixFQUFFLEVBQUUsT0FBTyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBRTVELE9BQU8sQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFFLE9BQU8sRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztZQUNwRCxDQUFDLENBQUM7aUJBQ0QsVUFBVSxDQUFDLEdBQXVCLEVBQUU7Z0JBQ25DLE1BQU0sUUFBUSxHQUFHLElBQUksQ0FBQztnQkFFdEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxxQkFBcUIsRUFBRSxFQUFFLE9BQU8sRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQztnQkFFckUsTUFBTSxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7Z0JBRXJCLE1BQU0sQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsRUFBRSxPQUFPLEVBQUUsUUFBUSxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUM7Z0JBRXBFLFNBQVMsQ0FBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFFBQVEsR0FBRyxDQUFDLENBQUMsQ0FBQztZQUM1QyxDQUFDLENBQUEsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUFBO0lBRUQsT0FBTztRQUNMLElBQUk7UUFDSixTQUFTO0tBQ1YsQ0FBQztBQUNKLENBQUM7QUF6REQsNERBeURDIn0=