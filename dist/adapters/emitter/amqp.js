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
function wrapHandler(handler) {
    return function ({ payload }) {
        return handler(payload);
    };
}
function createAQMPEmitterAdapter(irisOpts, logger = console) {
    let iris = funfix_1.None;
    const subscriptions = new Map();
    iris_1.default(Object.assign({}, irisOpts, { logger })).map((_iris) => {
        iris = funfix_1.Some(_iris);
        for (const [pattern, handler] of subscriptions.entries()) {
            _iris.register({ pattern, handler: wrapHandler(handler) });
        }
    })
        .subscribe();
    function emit(event) {
        return __awaiter(this, void 0, void 0, function* () {
            yield iris
                .map((i) => i.emit({ pattern: event.data.type, payload: event }))
                .getOrElseL(() => wait(1000).then(() => emit(event)));
        });
    }
    function subscribe(pattern, handler) {
        iris.map((i) => {
            i.register({ pattern, handler });
        });
        subscriptions.set(pattern, handler);
    }
    function unsubscribe(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            subscriptions.delete(pattern);
        });
    }
    return {
        emit,
        subscribe,
        unsubscribe,
        subscriptions,
    };
}
exports.createAQMPEmitterAdapter = createAQMPEmitterAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1xcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9lbWl0dGVyL2FtcXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLG1DQUE0QztBQUM1QywyQ0FBeUM7QUFRekMsU0FBZ0IsSUFBSSxDQUFDLENBQVM7SUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUpELG9CQUlDO0FBRUQsU0FBUyxXQUFXLENBQUMsT0FBMEI7SUFDN0MsT0FBTyxVQUFTLEVBQUMsT0FBTyxFQUFrQjtRQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsUUFBcUIsRUFBRSxTQUFpQixPQUFPO0lBQ3RGLElBQUksSUFBSSxHQUFpQixhQUFJLENBQUM7SUFDOUIsTUFBTSxhQUFhLEdBQW1DLElBQUksR0FBRyxFQUFFLENBQUM7SUFDaEUsY0FBUyxtQkFBTSxRQUFRLElBQUUsTUFBTSxJQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDOUMsSUFBSSxHQUFHLGFBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNuQixLQUFNLE1BQU0sQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLElBQUksYUFBYSxDQUFDLE9BQU8sRUFBRSxFQUFFO1lBQ3pELEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFFLFdBQVcsQ0FBQyxPQUFPLENBQUMsRUFBQyxDQUFDLENBQUM7U0FDMUQ7SUFDSCxDQUFDLENBQUM7U0FDRCxTQUFTLEVBQUUsQ0FBQztJQUViLFNBQWUsSUFBSSxDQUFDLEtBQTBDOztZQUM1RCxNQUFNLElBQUk7aUJBQ1AsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLE9BQU8sRUFBRSxLQUFLLEVBQUMsQ0FBQyxDQUFDO2lCQUM5RCxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQzFELENBQUM7S0FBQTtJQUVELFNBQVMsU0FBUyxDQUFDLE9BQWUsRUFBRSxPQUEwQjtRQUM1RCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUU7WUFDYixDQUFDLENBQUMsUUFBUSxDQUFDLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBQyxDQUFDLENBQUM7UUFDakMsQ0FBQyxDQUFDLENBQUM7UUFDSCxhQUFhLENBQUMsR0FBRyxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsQ0FBQztJQUN0QyxDQUFDO0lBRUQsU0FBZSxXQUFXLENBQUMsT0FBZTs7WUFDeEMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUNoQyxDQUFDO0tBQUE7SUFFRCxPQUFPO1FBQ0wsSUFBSTtRQUNKLFNBQVM7UUFDVCxXQUFXO1FBQ1gsYUFBYTtLQUNkLENBQUM7QUFDSixDQUFDO0FBbENELDREQWtDQyJ9