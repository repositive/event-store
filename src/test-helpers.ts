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
