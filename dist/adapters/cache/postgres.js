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
const insertAggregateCache = `
  INSERT INTO aggregate_cache (id, data, time)
  VALUES ($1, $2, $3)
  ON CONFLICT (id)
  DO UPDATE SET data = EXCLUDED.data, time = EXCLUDED.time;
`;
const aggregateCacheTable = `
  CREATE TABLE IF NOT EXISTS aggregate_cache(
    id VARCHAR(64) NOT NULL,
    data JSONB NOT NULL,
    time VARCHAR(24),
    PRIMARY KEY(id)
  );
`;
function createPgCacheAdapter(pool, logger = console) {
    pool.query(aggregateCacheTable)
        .catch((error) => {
        logger.error('Error creating cache table', error);
        throw error;
    });
    function get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { text: `SELECT * from aggregate_cache where id = $1`, values: [id] };
            logger.trace('execute query', query);
            const result = yield pool.query(query);
            logger.trace('db response', result);
            return funfix_1.Option.of(result.rows[0]);
        });
    }
    function set(id, entry) {
        return pool.query(insertAggregateCache, [id, JSON.stringify(entry.data), entry.time])
            .then(() => { });
    }
    return {
        get,
        set,
    };
}
exports.createPgCacheAdapter = createPgCacheAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYWRhcHRlcnMvY2FjaGUvcG9zdGdyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLG1DQUFzQztBQUd0QyxNQUFNLG9CQUFvQixHQUFHOzs7OztDQUs1QixDQUFDO0FBRUYsTUFBTSxtQkFBbUIsR0FBRzs7Ozs7OztDQU8zQixDQUFDO0FBRUYsU0FBZ0Isb0JBQW9CLENBQUMsSUFBVSxFQUFFLFNBQWlCLE9BQU87SUFFdkUsSUFBSSxDQUFDLEtBQUssQ0FBQyxtQkFBbUIsQ0FBQztTQUM1QixLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUNmLE1BQU0sQ0FBQyxLQUFLLENBQUMsNEJBQTRCLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDbEQsTUFBTSxLQUFLLENBQUM7SUFDZCxDQUFDLENBQUMsQ0FBQztJQUVMLFNBQWUsR0FBRyxDQUE0QixFQUFVOztZQUN0RCxNQUFNLEtBQUssR0FBRyxFQUFDLElBQUksRUFBRSw2Q0FBNkMsRUFBRSxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBQyxDQUFDO1lBQ2xGLE1BQU0sQ0FBQyxLQUFLLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO1lBQ3JDLE1BQU0sTUFBTSxHQUFHLE1BQU0sSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztZQUN2QyxNQUFNLENBQUMsS0FBSyxDQUFDLGFBQWEsRUFBRSxNQUFNLENBQUMsQ0FBQztZQUNwQyxPQUFPLGVBQU0sQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQ25DLENBQUM7S0FBQTtJQUVELFNBQVMsR0FBRyxDQUFDLEVBQVUsRUFBRSxLQUFzQjtRQUM3QyxPQUFPLElBQUksQ0FBQyxLQUFLLENBQUMsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQ2xGLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBTSxDQUFDLENBQUMsQ0FBQztJQUN4QixDQUFDO0lBRUQsT0FBTztRQUNMLEdBQUc7UUFDSCxHQUFHO0tBQ0osQ0FBQztBQUNKLENBQUM7QUF6QkQsb0RBeUJDIn0=