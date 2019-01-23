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
    pool.query(aggregateCacheTable).catch((error) => {
        logger.error("Error creating cache table", error);
        throw error;
    });
    function get(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = {
                text: `SELECT * from aggregate_cache where id = $1`,
                values: [id],
            };
            logger.trace("execute query", query);
            const result = yield pool.query(query);
            logger.trace("db response", result);
            return funfix_1.Option.of(result.rows[0]);
        });
    }
    function set(id, entry) {
        return pool
            .query(insertAggregateCache, [id, JSON.stringify(entry.data), entry.time])
            .then(() => {
            /**/
        });
    }
    return {
        get,
        set,
    };
}
exports.createPgCacheAdapter = createPgCacheAdapter;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYWRhcHRlcnMvY2FjaGUvcG9zdGdyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLG1DQUFzQztBQVd0QyxNQUFNLG9CQUFvQixHQUFHOzs7OztDQUs1QixDQUFDO0FBRUYsTUFBTSxtQkFBbUIsR0FBRzs7Ozs7OztDQU8zQixDQUFDO0FBRUYsU0FBZ0Isb0JBQW9CLENBQ2xDLElBQVUsRUFDVixTQUFpQixPQUFPO0lBRXhCLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEVBQUUsRUFBRTtRQUM5QyxNQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELE1BQU0sS0FBSyxDQUFDO0lBQ2QsQ0FBQyxDQUFDLENBQUM7SUFFSCxTQUFlLEdBQUcsQ0FDaEIsRUFBWTs7WUFFWixNQUFNLEtBQUssR0FBRztnQkFDWixJQUFJLEVBQUUsNkNBQTZDO2dCQUNuRCxNQUFNLEVBQUUsQ0FBQyxFQUFFLENBQUM7YUFDYixDQUFDO1lBQ0YsTUFBTSxDQUFDLEtBQUssQ0FBQyxlQUFlLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDckMsTUFBTSxNQUFNLEdBQUcsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1lBQ3BDLE9BQU8sZUFBTSxDQUFDLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkMsQ0FBQztLQUFBO0lBRUQsU0FBUyxHQUFHLENBQUMsRUFBWSxFQUFFLEtBQXNCO1FBQy9DLE9BQU8sSUFBSTthQUNSLEtBQUssQ0FBQyxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDekUsSUFBSSxDQUFDLEdBQUcsRUFBRTtZQUNULElBQUk7UUFDTixDQUFDLENBQUMsQ0FBQztJQUNQLENBQUM7SUFFRCxPQUFPO1FBQ0wsR0FBRztRQUNILEdBQUc7S0FDSixDQUFDO0FBQ0osQ0FBQztBQWxDRCxvREFrQ0MifQ==