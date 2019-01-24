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
const funfix_1 = require("funfix");
exports.cafebabe = "cafebabe-cafe-babe-cafe-babecafebabe";
exports.id = "d00dd00d-d00d-d00d-d00d-d00dd00dd00d";
const defaultQueryStub = sinon_1.stub().resolves({
    rows: [],
    totalCount: 0,
});
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
        command: "",
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
        .query(`INSERT INTO events (data, context) VALUES ($1, $2) RETURNING *`, [
        event.data,
        event.context,
    ])
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
function createFakeIterator(result) {
    let idx = 0;
    return {
        next: () => {
            idx++;
            if (idx > result.length) {
                return { done: true };
            }
            else {
                return { value: result[idx - 1], done: false };
            }
        },
    };
}
exports.createFakeIterator = createFakeIterator;
function getFakeStoreAdapter({ readStub, readSinceStub, saveStub, lastEventOf, exists, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const writer = saveStub ||
            function (evt) {
                return Promise.resolve(undefined);
            };
        const storeAdapter = {
            read: (readQuery, time, ...args) => {
                let idx = 0;
                const result = readStub(...args);
                if (!(result instanceof Array)) {
                    throw new Error("Read stub must return an array. Are you resolving a promise instead?");
                }
                return {
                    next: () => {
                        idx++;
                        if (idx > result.length) {
                            return { done: true };
                        }
                        else {
                            return { value: result[idx - 1], done: false };
                        }
                    },
                };
            },
            write: (event) => {
                return writer(event).then(() => funfix_1.Right(undefined));
            },
            lastEventOf: lastEventOf || (() => funfix_1.None),
            exists: exists || (() => Promise.resolve(true)),
            readEventSince: readSinceStub || (() => createFakeIterator([])),
        };
        return storeAdapter;
    });
}
exports.getFakeStoreAdapter = getFakeStoreAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdC1oZWxwZXJzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vc3JjL3Rlc3QtaGVscGVycy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7O0FBQUEsMkJBQTREO0FBQzVELGlDQUE2QjtBQUU3QixtQ0FBcUM7QUFFeEIsUUFBQSxRQUFRLEdBQUcsc0NBQXNDLENBQUM7QUFDbEQsUUFBQSxFQUFFLEdBQUcsc0NBQXNDLENBQUM7QUFFekQsTUFBTSxnQkFBZ0IsR0FBRyxZQUFJLEVBQUUsQ0FBQyxRQUFRLENBQUM7SUFDdkMsSUFBSSxFQUFFLEVBQUU7SUFDUixVQUFVLEVBQUUsQ0FBQztDQUNkLENBQUMsQ0FBQztBQUVILFNBQWdCLFdBQVcsQ0FBQyxZQUFpQixnQkFBZ0I7SUFDM0QsTUFBTSxRQUFRLEdBQUc7UUFDVCxLQUFLLENBQUMsQ0FBdUIsRUFBRSxNQUFjOztnQkFDakQsT0FBTyxTQUFTLENBQUMsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQzlCLENBQUM7U0FBQTtRQUNLLE9BQU87O2dCQUNYLE9BQU8sSUFBSSxDQUFDO1lBQ2QsQ0FBQztTQUFBO1FBQ0QsT0FBTztZQUNMLE9BQU8sU0FBUyxDQUFDO1FBQ25CLENBQUM7S0FDSyxDQUFDO0lBRVQsT0FBTyxRQUFRLENBQUM7QUFDbEIsQ0FBQztBQWRELGtDQWNDO0FBRUQsU0FBZ0IsY0FBYyxDQUFDLE9BQWMsRUFBRTtJQUM3QyxPQUFPO1FBQ0wsSUFBSTtRQUNKLFFBQVEsRUFBRSxJQUFJLENBQUMsTUFBTTtRQUNyQixPQUFPLEVBQUUsRUFBRTtRQUNYLEdBQUcsRUFBRSxDQUFDO1FBQ04sTUFBTSxFQUFFLEVBQUU7S0FDWCxDQUFDO0FBQ0osQ0FBQztBQVJELHdDQVFDO0FBRVksUUFBQSxXQUFXLEdBQUcsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLFNBQVMsQ0FBQztBQUVqRCx3QkFBd0I7QUFDeEIsU0FBZ0IsZUFBZTtJQUM3QixPQUFPLElBQUksU0FBSSxFQUFFLENBQUM7QUFDcEIsQ0FBQztBQUZELDBDQUVDO0FBRUQsd0JBQXdCO0FBQ3hCLFNBQWdCLFdBQVcsQ0FDekIsS0FBVSxFQUNWLE9BQVksZUFBZSxFQUFFO0lBRTdCLE9BQU8sSUFBSTtTQUNSLEtBQUssQ0FBQyxnRUFBZ0UsRUFBRTtRQUN2RSxLQUFLLENBQUMsSUFBSTtRQUNWLEtBQUssQ0FBQyxPQUFPO0tBQ2QsQ0FBQztTQUNELElBQUksQ0FBQyxDQUFDLEdBQVEsRUFBRSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3JDLENBQUM7QUFWRCxrQ0FVQztBQUVELHdCQUF3QjtBQUN4QixTQUFnQixXQUFXLENBQUMsT0FBWSxlQUFlLEVBQUU7SUFDdkQsT0FBTyxPQUFPLENBQUMsR0FBRyxDQUFDO1FBQ2pCLElBQUksQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUM7UUFDbkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQztLQUM3QyxDQUFDLENBQUM7QUFDTCxDQUFDO0FBTEQsa0NBS0M7QUFFRCx3QkFBd0I7QUFDeEIsU0FBc0IsS0FBSyxDQUN6QixDQUFTLEVBQ1QsT0FBWSxlQUFlLEVBQUU7O1FBRTdCLE9BQU8sQ0FBQyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7SUFDcEMsQ0FBQztDQUFBO0FBTEQsc0JBS0M7QUFFRCxTQUFnQixrQkFBa0IsQ0FBQyxNQUFhO0lBQzlDLElBQUksR0FBRyxHQUFHLENBQUMsQ0FBQztJQUVaLE9BQU87UUFDTCxJQUFJLEVBQUUsR0FBUSxFQUFFO1lBQ2QsR0FBRyxFQUFFLENBQUM7WUFFTixJQUFJLEdBQUcsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFO2dCQUN2QixPQUFPLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxDQUFDO2FBQ3ZCO2lCQUFNO2dCQUNMLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7YUFDaEQ7UUFDSCxDQUFDO0tBQ0YsQ0FBQztBQUNKLENBQUM7QUFkRCxnREFjQztBQUVELFNBQXNCLG1CQUFtQixDQUFDLEVBQ3hDLFFBQVEsRUFDUixhQUFhLEVBQ2IsUUFBUSxFQUNSLFdBQVcsRUFDWCxNQUFNLEdBT1A7O1FBQ0MsTUFBTSxNQUFNLEdBQ1YsUUFBUTtZQUNSLFVBQVMsR0FBUTtnQkFDZixPQUFPLE9BQU8sQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDcEMsQ0FBQyxDQUFDO1FBRUosTUFBTSxZQUFZLEdBQUc7WUFDbkIsSUFBSSxFQUFFLENBQUMsU0FBYyxFQUFFLElBQVMsRUFBRSxHQUFHLElBQVcsRUFBRSxFQUFFO2dCQUNsRCxJQUFJLEdBQUcsR0FBRyxDQUFDLENBQUM7Z0JBQ1osTUFBTSxNQUFNLEdBQUcsUUFBUSxDQUFDLEdBQUcsSUFBSSxDQUFDLENBQUM7Z0JBRWpDLElBQUksQ0FBQyxDQUFDLE1BQU0sWUFBWSxLQUFLLENBQUMsRUFBRTtvQkFDOUIsTUFBTSxJQUFJLEtBQUssQ0FDYixzRUFBc0UsQ0FDdkUsQ0FBQztpQkFDSDtnQkFFRCxPQUFPO29CQUNMLElBQUksRUFBRSxHQUFRLEVBQUU7d0JBQ2QsR0FBRyxFQUFFLENBQUM7d0JBRU4sSUFBSSxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRTs0QkFDdkIsT0FBTyxFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsQ0FBQzt5QkFDdkI7NkJBQU07NEJBQ0wsT0FBTyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsQ0FBQzt5QkFDaEQ7b0JBQ0gsQ0FBQztpQkFDRixDQUFDO1lBQ0osQ0FBQztZQUNELEtBQUssRUFBRSxDQUFDLEtBQTBDLEVBQWdCLEVBQUU7Z0JBQ2xFLE9BQU8sTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsQ0FBQyxjQUFLLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztZQUNwRCxDQUFDO1lBQ0QsV0FBVyxFQUFFLFdBQVcsSUFBSSxDQUFDLEdBQVEsRUFBRSxDQUFDLGFBQUksQ0FBQztZQUM3QyxNQUFNLEVBQUUsTUFBTSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQyxjQUFjLEVBQUUsYUFBYSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUMsa0JBQWtCLENBQUMsRUFBRSxDQUFDLENBQUM7U0FDaEUsQ0FBQztRQUVGLE9BQU8sWUFBWSxDQUFDO0lBQ3RCLENBQUM7Q0FBQTtBQW5ERCxrREFtREMifQ==