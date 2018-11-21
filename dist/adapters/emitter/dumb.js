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
function createDumbEmitterAdapter() {
    const subscriptions = new Map();
    function emit(event) {
        return __awaiter(this, void 0, void 0, function* () {
            /* I DO NOT DO ANYTHING */
        });
    }
    function subscribe(pattern, handler) {
        /* I DO NOT DO ANYTHING */
    }
    function unsubscribe(pattern) {
        return __awaiter(this, void 0, void 0, function* () {
            /* I DO NOT DO ANYTHING */
        });
    }
    return {
        emit,
        subscribe,
    };
}
exports.createDumbEmitterAdapter = createDumbEmitterAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVtYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9lbWl0dGVyL2R1bWIudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUVBLFNBQWdCLHdCQUF3QjtJQUV0QyxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0lBRWhDLFNBQWUsSUFBSSxDQUFDLEtBQVU7O1lBQzVCLDBCQUEwQjtRQUM1QixDQUFDO0tBQUE7SUFFRCxTQUFTLFNBQVMsQ0FBQyxPQUFlLEVBQUUsT0FBNEI7UUFDOUQsMEJBQTBCO0lBQzVCLENBQUM7SUFFRCxTQUFlLFdBQVcsQ0FBQyxPQUFlOztZQUN4QywwQkFBMEI7UUFDNUIsQ0FBQztLQUFBO0lBRUQsT0FBTztRQUNMLElBQUk7UUFDSixTQUFTO0tBQ1YsQ0FBQztBQUNKLENBQUM7QUFwQkQsNERBb0JDIn0=