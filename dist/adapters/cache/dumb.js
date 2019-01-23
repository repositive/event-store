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
function createDumbCacheAdapter() {
    function get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return funfix_1.None;
        });
    }
    function set(id, entry) {
        return __awaiter(this, void 0, void 0, function* () {
            /* I DO NOT DO ANYTHING */
        });
    }
    return {
        get,
        set,
    };
}
exports.createDumbCacheAdapter = createDumbCacheAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVtYi5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9hZGFwdGVycy9jYWNoZS9kdW1iLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBQSxtQ0FBc0M7QUFHdEMsU0FBZ0Isc0JBQXNCO0lBQ3BDLFNBQWUsR0FBRyxDQUNoQixFQUFZOztZQUVaLE9BQU8sYUFBSSxDQUFDO1FBQ2QsQ0FBQztLQUFBO0lBRUQsU0FBZSxHQUFHLENBQUMsRUFBWSxFQUFFLEtBQXNCOztZQUNyRCwwQkFBMEI7UUFDNUIsQ0FBQztLQUFBO0lBRUQsT0FBTztRQUNMLEdBQUc7UUFDSCxHQUFHO0tBQ0osQ0FBQztBQUNKLENBQUM7QUFmRCx3REFlQyJ9