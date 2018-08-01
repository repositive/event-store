import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { stub } from 'sinon';

export const cafebabe = "cafebabe-cafe-babe-cafe-babecafebabe";
export const id = "d00dd00d-d00d-d00d-d00d-d00dd00dd00d";

const defaultWriteStub = stub()
  .resolves({
    rows: [],
    totalCount: 0,
  });

export function createEvent(
  type: string,
  data: any,
  context: any = {},
  time: string = (new Date()).toISOString(),
): any {
    return {
      id,
      data: { ...data, type },
      context,
      time,
    };
}

export function getFakePool(readStub: any, writeStub: any = defaultWriteStub) {
  const fakePool = {
    async query(q: string | QueryConfig, values?: any[]): Promise<QueryResult> {
      return readStub(q, values);
    },
    async save(data: any, context?: any) {
      writeStub(data, context);
    },
  } as any;

  return fakePool;
}

export function fakePoolResult(rows: any[] = []): QueryResult {
  return {
    rows,
    rowCount: rows.length,
    command: '',
    oid: 0,
    fields: [],
  };
}

export const fakeEmitter = (e: any) => undefined;

// For integration tests
export function getDbConnection(): Pool {
  return new Pool();
}

// For integration tests
export function insertEvent(event: any, pool: any = getDbConnection()): Promise<any> {
  return pool
    .query(
      `INSERT INTO events (data, context) VALUES ($1, $2) RETURNING *`,
      [ event.data, event.context ],
    )
    .then((res: any) => res.rows[0]);
}

// For integration tests
export function truncateAll(pool: any = getDbConnection()): Promise<any> {
  return Promise.all([
    pool.query("TRUNCATE TABLE events"),
    pool.query("TRUNCATE TABLE aggregate_cache"),
  ]);
}

// For integration tests
export async function query(q: string, pool: any = getDbConnection()): Promise<any> {
  return (await pool.query(q)).rows;
}
