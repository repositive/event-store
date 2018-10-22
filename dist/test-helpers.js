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
const pg_1 = require("pg");
const sinon_1 = require("sinon");
exports.cafebabe = "cafebabe-cafe-babe-cafe-babecafebabe";
exports.id = "d00dd00d-d00d-d00d-d00d-d00dd00dd00d";
const defaultQueryStub = sinon_1.stub()
    .resolves({
    rows: [],
    totalCount: 0,
});
function createEvent(type, data, context = {}, time = '2018-01-01 01:01:01') {
    return {
        id: exports.id,
        data: Object.assign({}, data, { type }),
        context,
        time,
    };
}
exports.createEvent = createEvent;
function getFakePool(queryStub = defaultQueryStub) {
    const fakePool = {
        query(q, values) {
            return __awaiter(this, void 0, void 0, function* () {
                return queryStub(q, values);
            });
        },
        connect() {
            return __awaiter(this, void 0, void 0, function* () {
                return this;
            });
        },
        release() {
            return undefined;
        },
    };
    return fakePool;
}
exports.getFakePool = getFakePool;
function fakePoolResult(rows = []) {
    return {
        rows,
        rowCount: rows.length,
        command: '',
        oid: 0,
        fields: [],
    };
}
exports.fakePoolResult = fakePoolResult;
exports.fakeEmitter = (e) => undefined;
// For integration tests
function getDbConnection() {
    return new pg_1.Pool();
}
exports.getDbConnection = getDbConnection;
// For integration tests
function insertEvent(event, pool = getDbConnection()) {
    return pool
        .query(`INSERT INTO events (data, context) VALUES ($1, $2) RETURNING *`, [event.data, event.context])
        .then((res) => res.rows[0]);
}
exports.insertEvent = insertEvent;
// For integration tests
function truncateAll(pool = getDbConnection()) {
    return Promise.all([
        pool.query("TRUNCATE TABLE events"),
        pool.query("TRUNCATE TABLE aggregate_cache"),
    ]);
}
exports.truncateAll = truncateAll;
// For integration tests
function query(q, pool = getDbConnection()) {
    return __awaiter(this, void 0, void 0, function* () {
        return (yield pool.query(q)).rows;
    });
}
exports.query = query;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1oZWxwZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Rlc3QtaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsMkJBQTREO0FBQzVELGlDQUE2QjtBQUVoQixRQUFBLFFBQVEsR0FBRyxzQ0FBc0MsQ0FBQztBQUNsRCxRQUFBLEVBQUUsR0FBRyxzQ0FBc0MsQ0FBQztBQUV6RCxNQUFNLGdCQUFnQixHQUFHLFlBQUksRUFBRTtLQUM1QixRQUFRLENBQUM7SUFDUixJQUFJLEVBQUUsRUFBRTtJQUNSLFVBQVUsRUFBRSxDQUFDO0NBQ2QsQ0FBQyxDQUFDO0FBRUwsU0FBZ0IsV0FBVyxDQUN6QixJQUFZLEVBQ1osSUFBUyxFQUNULFVBQWUsRUFBRSxFQUNqQixPQUFlLHFCQUFxQjtJQUVsQyxPQUFPO1FBQ0wsRUFBRSxFQUFGLFVBQUU7UUFDRixJQUFJLG9CQUFPLElBQUksSUFBRSxJQUFJLEdBQUU7UUFDdkIsT0FBTztRQUNQLElBQUk7S0FDTCxDQUFDO0FBQ04sQ0FBQztBQVpELGtDQVlDO0FBRUQsU0FBZ0IsV0FBVyxDQUFDLFlBQWlCLGdCQUFnQjtJQUMzRCxNQUFNLFFBQVEsR0FBRztRQUNULEtBQUssQ0FBQyxDQUF1QixFQUFFLE1BQWM7O2dCQUNqRCxPQUFPLFNBQVMsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDOUIsQ0FBQztTQUFBO1FBQ0ssT0FBTzs7Z0JBQ1gsT0FBTyxJQUFJLENBQUM7WUFDZCxDQUFDO1NBQUE7UUFDRCxPQUFPO1lBQ0wsT0FBTyxTQUFTLENBQUM7UUFDbkIsQ0FBQztLQUNLLENBQUM7SUFFVCxPQUFPLFFBQVEsQ0FBQztBQUNsQixDQUFDO0FBZEQsa0NBY0M7QUFFRCxTQUFnQixjQUFjLENBQUMsT0FBYyxFQUFFO0lBQzdDLE9BQU87UUFDTCxJQUFJO1FBQ0osUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNO1FBQ3JCLE9BQU8sRUFBRSxFQUFFO1FBQ1gsR0FBRyxFQUFFLENBQUM7UUFDTixNQUFNLEVBQUUsRUFBRTtLQUNYLENBQUM7QUFDSixDQUFDO0FBUkQsd0NBUUM7QUFFWSxRQUFBLFdBQVcsR0FBRyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQUMsU0FBUyxDQUFDO0FBRWpELHdCQUF3QjtBQUN4QixTQUFnQixlQUFlO0lBQzdCLE9BQU8sSUFBSSxTQUFJLEVBQUUsQ0FBQztBQUNwQixDQUFDO0FBRkQsMENBRUM7QUFFRCx3QkFBd0I7QUFDeEIsU0FBZ0IsV0FBVyxDQUFDLEtBQVUsRUFBRSxPQUFZLGVBQWUsRUFBRTtJQUNuRSxPQUFPLElBQUk7U0FDUixLQUFLLENBQ0osZ0VBQWdFLEVBQ2hFLENBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFFLENBQzlCO1NBQ0EsSUFBSSxDQUFDLENBQUMsR0FBUSxFQUFFLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckMsQ0FBQztBQVBELGtDQU9DO0FBRUQsd0JBQXdCO0FBQ3hCLFNBQWdCLFdBQVcsQ0FBQyxPQUFZLGVBQWUsRUFBRTtJQUN2RCxPQUFPLE9BQU8sQ0FBQyxHQUFHLENBQUM7UUFDakIsSUFBSSxDQUFDLEtBQUssQ0FBQyx1QkFBdUIsQ0FBQztRQUNuQyxJQUFJLENBQUMsS0FBSyxDQUFDLGdDQUFnQyxDQUFDO0tBQzdDLENBQUMsQ0FBQztBQUNMLENBQUM7QUFMRCxrQ0FLQztBQUVELHdCQUF3QjtBQUN4QixTQUFzQixLQUFLLENBQUMsQ0FBUyxFQUFFLE9BQVksZUFBZSxFQUFFOztRQUNsRSxPQUFPLENBQUMsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDO0lBQ3BDLENBQUM7Q0FBQTtBQUZELHNCQUVDIn0=