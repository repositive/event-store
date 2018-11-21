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
            const where_time = fmtTime.map((t) => `WHERE events.context->>'time' > '${t}'`).getOrElse('');
            const cached_query = `
      SELECT * FROM (${query.text}) AS events
      ${where_time}
      ORDER BY events.context->>'time' ASC
    `;
            try {
                yield __await(transaction.query('BEGIN'));
                const cursorQuery = { text: `DECLARE ${cursorId} CURSOR FOR (${cached_query})`, values: args };
                logger.trace('Cursor query', cursorQuery);
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
                yield __await(transaction.query('COMMIT'));
            }
            catch (error) {
                logger.error('errorInCursor', error);
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
            return pool.query('INSERT INTO events(id, data, context) values ($1, $2, $3)', [event.id, event.data, event.context])
                .then(() => funfix_1.Right(undefined))
                .catch((err) => {
                if (err instanceof Error) {
                    // duplicate key value violates unique constraint "events_pkey"
                    if (err.message.includes('violates unique constraint')) {
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
            return pool.query(`select * from events where data->>'type' = $1 order by context->>'time' desc limit 1`, [eventType]).then((results) => funfix_1.Option.of(results.rows[0]));
        });
    }
    function exists(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return pool.query(`select * from events where id = $1`, [id]).then((results) => !!results.rows[0]);
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYWRhcHRlcnMvc3RvcmUvcG9zdGdyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLCtCQUEwQjtBQUMxQiw4QkFBdUY7QUFDdkYsbUNBQTBEO0FBUTFELE1BQU0sV0FBVyxHQUFHOzs7Ozs7Q0FNbkIsQ0FBQztBQUVGLFNBQWdCLG9CQUFvQixDQUFDLElBQVUsRUFBRSxTQUFpQixPQUFPO0lBRXZFLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDdEMsTUFBTSxLQUFLLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztJQUVILFNBQWdCLElBQUksQ0FDbEIsS0FBYyxFQUNkLFFBQXdCLGFBQUk7SUFDNUIsMENBQTBDO0lBQzFDLEdBQUcsSUFBVzs7WUFFZCxNQUFNLFFBQVEsR0FBRyxJQUFJLFNBQUUsRUFBRSxHQUFHLENBQUM7WUFDN0IsTUFBTSxXQUFXLEdBQUcsY0FBTSxJQUFJLENBQUMsT0FBTyxFQUFFLENBQUEsQ0FBQztZQUN6QyxNQUFNLE9BQU8sR0FBRyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBTSxFQUFFLEVBQUUsQ0FBQyxDQUFDLFlBQVksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQy9FLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLG9DQUFvQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsQ0FBQztZQUM5RixNQUFNLFlBQVksR0FBRzt1QkFDRixLQUFLLENBQUMsSUFBSTtRQUN6QixVQUFVOztLQUViLENBQUM7WUFDRixJQUFJO2dCQUNGLGNB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