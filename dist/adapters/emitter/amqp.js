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
function createAQMPEmitterAdapter(connectionString, logger = console) {
    let iris = funfix_1.None;
    const subscriptions = new Map();
    iris_1.default({ uri: connectionString, logger }).map((_iris) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1xcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9lbWl0dGVyL2FtcXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLG1DQUE0QztBQUM1QywyQ0FBeUM7QUFHekMsU0FBZ0IsSUFBSSxDQUFDLENBQVM7SUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUpELG9CQUlDO0FBRUQsU0FBUyxXQUFXLENBQUMsT0FBMEI7SUFDN0MsT0FBTyxVQUFTLEVBQUMsT0FBTyxFQUFrQjtRQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsZ0JBQXdCLEVBQUUsU0FBaUIsT0FBTztJQUN6RixJQUFJLElBQUksR0FBaUIsYUFBSSxDQUFDO0lBQzlCLE1BQU0sYUFBYSxHQUFtQyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBQ2hFLGNBQVMsQ0FBQyxFQUFDLEdBQUcsRUFBRSxnQkFBZ0IsRUFBRSxNQUFNLEVBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3ZELElBQUksR0FBRyxhQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7UUFDbkIsS0FBTSxNQUFNLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxJQUFJLGFBQWEsQ0FBQyxPQUFPLEVBQUUsRUFBRTtZQUN6RCxLQUFLLENBQUMsUUFBUSxDQUFDLEVBQUMsT0FBTyxFQUFFLE9BQU8sRUFBRSxXQUFXLENBQUMsT0FBTyxDQUFDLEVBQUMsQ0FBQyxDQUFDO1NBQzFEO0lBQ0gsQ0FBQyxDQUFDO1NBQ0QsU0FBUyxFQUFFLENBQUM7SUFFYixTQUFlLElBQUksQ0FBQyxLQUEwQzs7WUFDNUQsTUFBTSxJQUFJO2lCQUNQLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxPQUFPLEVBQUUsS0FBSyxFQUFDLENBQUMsQ0FBQztpQkFDOUQsVUFBVSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUMxRCxDQUFDO0tBQUE7SUFFRCxTQUFTLFNBQVMsQ0FBQyxPQUFlLEVBQUUsT0FBMEI7UUFDNUQsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFO1lBQ2IsQ0FBQyxDQUFDLFFBQVEsQ0FBQyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUMsQ0FBQyxDQUFDO1FBQ2pDLENBQUMsQ0FBQyxDQUFDO1FBQ0gsYUFBYSxDQUFDLEdBQUcsQ0FBQyxPQUFPLEVBQUUsT0FBTyxDQUFDLENBQUM7SUFDdEMsQ0FBQztJQUVELFNBQWUsV0FBVyxDQUFDLE9BQWU7O1lBQ3hDLGFBQWEsQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDaEMsQ0FBQztLQUFBO0lBRUQsT0FBTztRQUNMLElBQUk7UUFDSixTQUFTO1FBQ1QsV0FBVztRQUNYLGFBQWE7S0FDZCxDQUFDO0FBQ0osQ0FBQztBQWxDRCw0REFrQ0MifQ==