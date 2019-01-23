"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __await = (this && this.__await) || function (v) { return this instanceof __await ? (this.v = v, this) : new __await(v); }
var __asyncGenerator = (this && this.__asyncGenerator) || function (thisArg, _arguments, generator) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var g = generator.apply(thisArg, _arguments || []), i, q = [];
    return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
    function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
    function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
    function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
    function fulfill(value) { resume("next", value); }
    function reject(value) { resume("throw", value); }
    function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
};
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const _1 = require("../../.");
const funfix_1 = require("funfix");
const eventsTable = `
  CREATE TABLE IF NOT EXISTS events(
    id UUID DEFAULT uuid_generate_v4() primary key,
    data JSONB NOT NULL,
    context JSONB DEFAULT '{}'
  );
`;
function createPgStoreAdapter(pool, logger = console) {
    pool.query(eventsTable).catch((error) => {
        throw error;
    });
    function read(query, since = funfix_1.None, 
    // tslint:disable-next-line trailing-comma
    ...args) {
        return __asyncGenerator(this, arguments, function* read_1() {
            const cursorId = `"${uuid_1.v4()}"`;
            const transaction = yield __await(pool.connect());
            const fmtTime = since.map((t) => t instanceof Date ? t.toISOString() : t);
            const where_time = fmtTime
                .map((t) => `WHERE events.context->>'time' > '${t}'`)
                .getOrElse("");
            const cached_query = `
      SELECT * FROM (${query.text}) AS events
      ${where_time}
      ORDER BY events.context->>'time' ASC
    `;
            try {
                yield __await(transaction.query("BEGIN"));
                const cursorQuery = {
                    text: `DECLARE ${cursorId} CURSOR FOR (${cached_query})`,
                    values: args,
                };
                logger.trace("Cursor query", cursorQuery);
                yield __await(transaction.query(cursorQuery));
                while (true) {
                    const results = yield __await(transaction.query(`FETCH 100 FROM ${cursorId}`));
                    if (results.rowCount > 0) {
                        for (const row of results.rows) {
                            yield yield __await(row);
                        }
                    }
                    else {
                        break;
                    }
                }
                yield __await(transaction.query("COMMIT"));
            }
            catch (error) {
                logger.error("errorInCursor", error);
                throw error;
            }
            finally {
                transaction.release();
            }
        });
    }
    /**
     *  This will return an either Left(DuplicateError), Left(Error) or Right(void);
     *
     *
     */
    function write(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return pool
                .query("INSERT INTO events(id, data, context) values ($1, $2, $3)", [
                event.id,
                event.data,
                event.context,
            ])
                .then(() => funfix_1.Right(undefined))
                .catch((err) => {
                if (err instanceof Error) {
                    // duplicate key value violates unique constraint "events_pkey"
                    if (err.message.includes("violates unique constraint")) {
                        return funfix_1.Left(new _1.DuplicateError());
                    }
                    return funfix_1.Left(err);
                }
                else {
                    return funfix_1.Left(new Error(err));
                }
            });
        });
    }
    function lastEventOf(eventType) {
        return __awaiter(this, void 0, void 0, function* () {
            return pool
                .query(`select * from events where data->>'type' = $1 order by context->>'time' desc limit 1`, [eventType])
                .then((results) => funfix_1.Option.of(results.rows[0]));
        });
    }
    function exists(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return pool
                .query(`select * from events where id = $1`, [id])
                .then((results) => !!results.rows[0]);
        });
    }
    function readEventSince(eventType, since = funfix_1.None) {
        return read({
            text: `select * from events where data->>'type' = $1`,
        }, since, eventType);
    }
    return {
        read,
        write,
        lastEventOf,
        readEventSince,
        exists,
    };
}
exports.createPgStoreAdapter = createPgStoreAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYWRhcHRlcnMvc3RvcmUvcG9zdGdyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLCtCQUEwQjtBQUMxQiw4QkFRaUI7QUFDakIsbUNBQTJEO0FBUTNELE1BQU0sV0FBVyxHQUFHOzs7Ozs7Q0FNbkIsQ0FBQztBQUVGLFNBQWdCLG9CQUFvQixDQUNsQyxJQUFVLEVBQ1YsU0FBaUIsT0FBTztJQUV4QixJQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEtBQUssRUFBRSxFQUFFO1FBQ3RDLE1BQU0sS0FBSyxDQUFDO0lBQ2QsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFnQixJQUFJLENBQ2xCLEtBQWMsRUFDZCxRQUErQixhQUFJO0lBQ25DLDBDQUEwQztJQUMxQyxHQUFHLElBQVc7O1lBRWQsTUFBTSxRQUFRLEdBQUcsSUFBSSxTQUFFLEVBQUUsR0FBRyxDQUFDO1lBQzdCLE1BQU0sV0FBVyxHQUFHLGNBQU0sSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFBLENBQUM7WUFDekMsTUFBTSxPQUFPLEdBQUcsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQU0sRUFBRSxFQUFFLENBQ25DLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUN4QyxDQUFDO1lBQ0YsTUFBTSxVQUFVLEdBQUcsT0FBTztpQkFDdkIsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxvQ0FBb0MsQ0FBQyxHQUFHLENBQUM7aUJBQ3BELFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUNqQixNQUFNLFlBQVksR0FBRzt1QkFDRixLQUFLLENBQUMsSUFBSTtRQUN6QixVQUFVOztLQUViLENBQUM7WUFDRixJQUFJO2dC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