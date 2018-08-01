import { Client, Pool, QueryConfig, QueryResult } from 'pg';
import { stub } from 'sinon';

export const cafebabe = "cafebabe-cafe-babe-cafe-babecafebabe";

const defaultWriteStub = stub()
  .resolves({
    rows: [],
    totalCount: 0,
  });

const typeFiller = {
  // async connect(): Promise<any> {
  //   return Promise.resolve();
  // },
  // async end(): Promise<void> {
  //   return Promise.resolve();
  // },
  // async on(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async addListener(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async once(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async prependListener(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async prependOnceListener(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async removeListener(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async removeOnceListener(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async off(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async removeAllListeners(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async setMaxListeners(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async getMaxListeners(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async emit(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async eventNames(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // async listenerCount(...args: any[]): Promise<any> {
  //   return Promise.resolve();
  // },
  // listeners: null,
  // rawListeners: null,
  // totalCount: 0,
  // idleCount: 0,
  // waitingCount: 0,
};

export function getFakePool(readStub: any, writeStub: any = defaultWriteStub) {
  const fakePool = {
    async query(q: string | QueryConfig, values?: any[]): Promise<QueryResult> {
      return readStub(q, values);
    },
    async save(data: any, context?: any) {
      writeStub(data, context);
    },
    // ...typeFiller,
  } as any;

  return fakePool;
}
