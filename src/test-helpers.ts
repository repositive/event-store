import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { stub } from 'sinon';
import { Event, EventData, EventContext } from '.';
import { Right, None } from 'funfix';

export const cafebabe = "cafebabe-cafe-babe-cafe-babecafebabe";
export const id = "d00dd00d-d00d-d00d-d00d-d00dd00dd00d";

const defaultQueryStub = stub()
  .resolves({
    rows: [],
    totalCount: 0,
  });

export function createEvent(
  type: string,
  data: any,
  context: any = {},
  time: string = '2018-01-01 01:01:01',
): any {
    return {
      id,
      data: { ...data, type },
      context,
      time,
    };
}

export function getFakePool(queryStub: any = defaultQueryStub) {
  const fakePool = {
    async query(q: string | QueryConfig, values?: any[]): Promise<QueryResult> {
      return queryStub(q, values);
    },
    async connect(): Promise<any> {
      return this;
    },
    release() {
      return undefined;
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

export function createFakeIterator(result: any[]) {
  let idx = 0;

  return {
    next: (): any => {
      idx++;

      if (idx > result.length) {
        return { done: true };
      } else {
        return { value: result[idx - 1], done: false };
      }
    },
  };
}

export async function getFakeStoreAdapter({
  readStub,
  readSinceStub,
  saveStub,
  lastEventOf,
  exists,
}: {
  readStub?: any,
  readSinceStub?: any,
  saveStub?: (evt: any) => Promise<undefined>,
  lastEventOf?: (pattern: string) => Promise<Event<any, any>>,
  exists?: (id: string) => Promise<boolean>,
}): Promise<any> {
  const writer =
    saveStub ||
    function(evt: any): Promise<undefined> {
      return Promise.resolve(undefined);
    };

  const storeAdapter = {
    read: (readQuery: any, time: any, ...args: any[]) => {
      let idx = 0;
      const result = readStub(...args);

      if (!(result instanceof Array)) {
        throw new Error('Read stub must return an array. Are you resolving a promise instead?');
      }

      return {
        next: (): any => {
          idx++;

          if (idx > result.length) {
            return { done: true };
          } else {
            return { value: result[idx - 1], done: false };
          }
        },
      };
    },
    write: (event: Event<EventData, EventContext<any>>): Promise<any> => {
      return writer(event).then(() => Right(undefined));
    },
    lastEventOf: lastEventOf || ((): any => None),
    exists: exists || (() => Promise.resolve(true)),
    readEventSince: readSinceStub || (() => createFakeIterator([])),
  };

  return storeAdapter;
}
