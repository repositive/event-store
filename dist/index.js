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
const event_store_1 = require("./event-store");
var helpers_1 = require("./helpers");
exports.isEvent = helpers_1.isEvent;
exports.createEvent = helpers_1.createEvent;
exports.createContext = helpers_1.createContext;
__export(require("./event-store"));
__export(require("./adapters"));
function newEventStore(store, _options) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = _options || {};
        const { logger = console } = options;
        logger.warn(`
    DEPRECATED WARNING!
    The newEventStore function is deprecated and will be remove in a future version of the store.
    Use the EventStore class instead.
  `);
        return new event_store_1.EventStore(store, _options);
    });
}
exports.newEventStore = newEventStore;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi9zcmMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUlBLCtDQUE4RDtBQUM5RCxxQ0FBZ0U7QUFBdkQsNEJBQUEsT0FBTyxDQUFBO0FBQUUsZ0NBQUEsV0FBVyxDQUFBO0FBQUUsa0NBQUEsYUFBYSxDQUFBO0FBQzVDLG1DQUE4QjtBQUM5QixnQ0FBMkI7QUErQjNCLFNBQXNCLGFBQWEsQ0FDakMsS0FBc0IsRUFDdEIsUUFBNEI7O1FBRTVCLE1BQU0sT0FBTyxHQUFHLFFBQVEsSUFBSSxFQUFFLENBQUM7UUFDL0IsTUFBTSxFQUFFLE1BQU0sR0FBRyxPQUFPLEVBQUUsR0FBRyxPQUFPLENBQUM7UUFDckMsTUFBTSxDQUFDLElBQUksQ0FBQzs7OztHQUlYLENBQUMsQ0FBQztRQUNILE9BQU8sSUFBSSx3QkFBVSxDQUFDLEtBQUssRUFBRSxRQUFRLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQUE7QUFaRCxzQ0FZQyJ9