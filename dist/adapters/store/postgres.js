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
    function write(event) {
        return __awaiter(this, void 0, void 0, function* () {
            return pool.query('INSERT INTO events(id, data, context) values ($1, $2, $3)', [event.id, event.data, event.context]).then(() => { });
        });
    }
    function lastEventOf(eventType) {
        return __awaiter(this, void 0, void 0, function* () {
            return pool.query(`select * from events where data->>'type' = $1 order by context->>'time' desc limit 1`, [eventType]).then((results) => funfix_1.Option.of(results.rows[0]));
        });
    }
    function readEventSince(eventType, since = funfix_1.None) {
        return read({
            text: `select * from events where data->>'type' = $1`,
            values: [eventType],
        }, since);
    }
    return {
        read,
        write,
        lastEventOf,
        readEventSince,
    };
}
exports.createPgStoreAdapter = createPgStoreAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYWRhcHRlcnMvc3RvcmUvcG9zdGdyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUNBLCtCQUEwQjtBQUUxQixtQ0FBcUM7QUFRckMsTUFBTSxXQUFXLEdBQUc7Ozs7OztDQU1uQixDQUFDO0FBRUYsU0FBZ0Isb0JBQW9CLENBQUMsSUFBVSxFQUFFLFNBQWlCLE9BQU87SUFFdkUsSUFBSSxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUN0QyxNQUFNLEtBQUssQ0FBQztJQUNkLENBQUMsQ0FBQyxDQUFDO0lBRUgsU0FBZ0IsSUFBSSxDQUNsQixLQUFjLEVBQ2QsUUFBd0IsYUFBSTtJQUM1QiwwQ0FBMEM7SUFDMUMsR0FBRyxJQUFXOztZQUVkLE1BQU0sUUFBUSxHQUFHLElBQUksU0FBRSxFQUFFLEdBQUcsQ0FBQztZQUM3QixNQUFNLFdBQVcsR0FBRyxjQUFNLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQSxDQUFDO1lBQ3pDLE1BQU0sT0FBTyxHQUFHLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFNLEVBQUUsRUFBRSxDQUFDLENBQUMsWUFBWSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxXQUFXLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDL0UsTUFBTSxVQUFVLEdBQUcsT0FBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsb0NBQW9DLENBQUMsR0FBRyxDQUFDLENBQUMsU0FBUyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzlGLE1BQU0sWUFBWSxHQUFHO3VCQUNGLEtBQUssQ0FBQyxJQUFJO1FBQ3pCLFVBQVU7O0tBRWIsQ0FBQztZQUNGLElBQUk7Z0JBQ0YsY0FBTSxXQUFXLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxDQUFBLENBQUM7Z0JBQ2pDLE1BQU0sV0FBVyxHQUFHLEVBQUMsSUFBSSxFQUFFLFdBQVcsUUFBUSxnQkFBZ0IsWUFBWSxHQUFHLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBQyxDQUFDO2dCQUM3RixNQUFNLENBQUMsS0FBSyxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztnQkFDMUMsY0FBTSxXQUFXLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxDQUFBLENBQUM7Z0JBQ3JDLE9BQU8sSUFBSSxFQUFFO29CQUNYLE1BQU0sT0FBTyxHQUFHLGNBQU0sV0FBVyxDQUFDLEtBQUssQ0FBQyxrQkFBa0IsUUFBUSxFQUFFLENBQUMsQ0FBQSxDQUFDO29CQUN0RSxJQUFJLE9BQU8sQ0FBQyxRQUFRLEdBQUcsQ0FBQyxFQUFFO3dCQUN4QixLQUFLLE1BQU0sR0FBRyxJQUFJLE9BQU8sQ0FBQyxJQUFJLEVBQUU7NEJBQzlCLG9CQUFNLEdBQUcsQ0FBQSxDQUFDO3lCQUNYO3FCQUNGO3lCQUFNO3dCQUNMLE1BQU07cUJBQ1A7aUJBQ0Y7Z0JBRUQsY0FBTSxXQUFXLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxDQUFBLENBQUM7YUFDbkM7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztnQkFDckMsTUFBTSxLQUFLLENBQUM7YUFDYjtvQkFBUztnQkFDUixXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDdkI7UUFDSCxDQUFDO0tBQUE7SUFFRCxTQUFlLEtBQUssQ0FBQyxLQUEwQzs7WUFDN0QsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUNmLDJEQUEyRCxFQUMzRCxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsT0FBTyxDQUFDLENBQ3RDLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxHQUFNLENBQUMsQ0FBQyxDQUFDO1FBQ3ZCLENBQUM7S0FBQTtJQUVELFNBQWUsV0FBVyxDQUE0QixTQUFpQjs7WUFDckUsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUNmLHNGQUFzRixFQUN0RixDQUFDLFNBQVMsQ0FBQyxDQUNaLENBQUMsSUFBSSxDQUFDLENBQUMsT0FBTyxFQUFFLEVBQUUsQ0FBQyxlQUFNLENBQUMsRUFBRSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ2xELENBQUM7S0FBQTtJQUVELFNBQVMsY0FBYyxDQUFDLFNBQWlCLEVBQUUsUUFBd0IsYUFBSTtRQUNyRSxPQUFPLElBQUksQ0FDVDtZQUNFLElBQUksRUFBRSwrQ0FBK0M7WUFDckQsTUFBTSxFQUFFLENBQUMsU0FBUyxDQUFDO1NBQ3BCLEVBQ0QsS0FBSyxDQUNOLENBQUM7SUFDSixDQUFDO0lBRUQsT0FBTztRQUNMLElBQUk7UUFDSixLQUFLO1FBQ0wsV0FBVztRQUNYLGNBQWM7S0FDZixDQUFDO0FBQ0osQ0FBQztBQTVFRCxvREE0RUMifQ==