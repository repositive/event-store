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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicG9zdGdyZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvYWRhcHRlcnMvY2FjaGUvcG9zdGdyZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7OztBQUNBLG1DQUFzQztBQUd0QyxNQUFNLG9CQUFvQixHQUFHOzs7Q0FHNUIsQ0FBQztBQUVGLE1BQU0sbUJBQW1CLEdBQUc7Ozs7Ozs7Q0FPM0IsQ0FBQztBQUVGLFNBQWdCLG9CQUFvQixDQUFDLElBQVUsRUFBRSxTQUFpQixPQUFPO0lBRXZFLElBQUksQ0FBQyxLQUFLLENBQUMsbUJBQW1CLENBQUM7U0FDNUIsS0FBSyxDQUFDLENBQUMsS0FBSyxFQUFFLEVBQUU7UUFDZixNQUFNLENBQUMsS0FBSyxDQUFDLDRCQUE0QixFQUFFLEtBQUssQ0FBQyxDQUFDO1FBQ2xELE1BQU0sS0FBSyxDQUFDO0lBQ2QsQ0FBQyxDQUFDLENBQUM7SUFFTCxTQUFlLEdBQUcsQ0FBNEIsRUFBVTs7WUFDdEQsTUFBTSxLQUFLLEdBQUcsRUFBQyxJQUFJLEVBQUUsNkNBQTZDLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQztZQUNsRixNQUFNLENBQUMsS0FBSyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztZQUNyQyxNQUFNLE1BQU0sR0FBRyxNQUFNLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUM7WUFDdkMsTUFBTSxDQUFDLEtBQUssQ0FBQyxhQUFhLEVBQUUsTUFBTSxDQUFDLENBQUM7WUFDcEMsT0FBTyxlQUFNLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNuQyxDQUFDO0tBQUE7SUFFRCxTQUFTLEdBQUcsQ0FBQyxFQUFVLEVBQUUsS0FBc0I7UUFDN0MsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLG9CQUFvQixFQUFFLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNsRixJQUFJLENBQUMsR0FBRyxFQUFFLEdBQU0sQ0FBQyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELE9BQU87UUFDTCxHQUFHO1FBQ0gsR0FBRztLQUNKLENBQUM7QUFDSixDQUFDO0FBekJELG9EQXlCQyJ9