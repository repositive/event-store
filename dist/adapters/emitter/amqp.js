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
function createAQMPEmitterAdapter(connectionString) {
    let iris = funfix_1.None;
    const subscriptions = new Map();
    iris_1.default({ uri: connectionString }).map((_iris) => {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYW1xcC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9lbWl0dGVyL2FtcXAudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLG1DQUE0QztBQUM1QywyQ0FBeUM7QUFHekMsU0FBZ0IsSUFBSSxDQUFDLENBQVM7SUFDNUIsT0FBTyxJQUFJLE9BQU8sQ0FBQyxDQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUUsRUFBRTtRQUNyQyxVQUFVLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxFQUFFLENBQUMsQ0FBQyxDQUFDO0lBQy9CLENBQUMsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUpELG9CQUlDO0FBRUQsU0FBUyxXQUFXLENBQUMsT0FBMEI7SUFDN0MsT0FBTyxVQUFTLEVBQUMsT0FBTyxFQUFrQjtRQUN4QyxPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUMxQixDQUFDLENBQUM7QUFDSixDQUFDO0FBRUQsU0FBZ0Isd0JBQXdCLENBQUMsZ0JBQXdCO0lBQy9ELElBQUksSUFBSSxHQUFpQixhQUFJLENBQUM7SUFDOUIsTUFBTSxhQUFhLEdBQW1DLElBQUksR0FBRyxFQUFFLENBQUM7SUFDaEUsY0FBUyxDQUFDLEVBQUMsR0FBRyxFQUFFLGdCQUFnQixFQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUMvQyxJQUFJLEdBQUcsYUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25CLEtBQU0sTUFBTSxDQUFDLE9BQU8sRUFBRSxPQUFPLENBQUMsSUFBSSxhQUFhLENBQUMsT0FBTyxFQUFFLEVBQUU7WUFDekQsS0FBSyxDQUFDLFFBQVEsQ0FBQyxFQUFDLE9BQU8sRUFBRSxPQUFPLEVBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFDLENBQUMsQ0FBQztTQUMxRDtJQUNILENBQUMsQ0FBQztTQUNELFNBQVMsRUFBRSxDQUFDO0lBRWIsU0FBZSxJQUFJLENBQUMsS0FBMEM7O1lBQzVELE1BQU0sSUFBSTtpQkFDUCxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBQyxPQUFPLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUUsT0FBTyxFQUFFLEtBQUssRUFBQyxDQUFDLENBQUM7aUJBQzlELFVBQVUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDMUQsQ0FBQztLQUFBO0lBRUQsU0FBUyxTQUFTLENBQUMsT0FBZSxFQUFFLE9BQTBCO1FBQzVELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRTtZQUNiLENBQUMsQ0FBQyxRQUFRLENBQUMsRUFBQyxPQUFPLEVBQUUsT0FBTyxFQUFDLENBQUMsQ0FBQztRQUNqQyxDQUFDLENBQUMsQ0FBQztRQUNILGFBQWEsQ0FBQyxHQUFHLENBQUMsT0FBTyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0lBQ3RDLENBQUM7SUFFRCxTQUFlLFdBQVcsQ0FBQyxPQUFlOztZQUN4QyxhQUFhLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ2hDLENBQUM7S0FBQTtJQUVELE9BQU87UUFDTCxJQUFJO1FBQ0osU0FBUztRQUNULFdBQVc7UUFDWCxhQUFhO0tBQ2QsQ0FBQztBQUNKLENBQUM7QUFsQ0QsNERBa0NDIn0=