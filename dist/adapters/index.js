"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
__export(require("./cache/postgres"));
__export(require("./cache/dumb"));
__export(require("./emitter/amqp"));
__export(require("./emitter/dumb"));
__export(require("./store/postgres"));
/**
Returned when an attempt was made to save an event, but an event by the given ID already exists in
the backing store
*/
class DuplicateError extends Error {
}
exports.DuplicateError = DuplicateError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvYWRhcHRlcnMvaW5kZXgudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFVQSxzQ0FBaUM7QUFDakMsa0NBQTZCO0FBQzdCLG9DQUErQjtBQUMvQixvQ0FBK0I7QUFDL0Isc0NBQWlDO0FBcUZqQzs7O0VBR0U7QUFDRixNQUFhLGNBQWUsU0FBUSxLQUFLO0NBQUc7QUFBNUMsd0NBQTRDIn0=