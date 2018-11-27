import { Pool, QueryResult } from 'pg';
import { Event } from '.';
export declare const cafebabe = "cafebabe-cafe-babe-cafe-babecafebabe";
export declare const id = "d00dd00d-d00d-d00d-d00d-d00dd00dd00d";
export declare function getFakePool(queryStub?: any): any;
export declare function fakePoolResult(rows?: any[]): QueryResult;
export declare const fakeEmitter: (e: any) => undefined;
export declare function getDbConnection(): Pool;
export declare function insertEvent(event: any, pool?: any): Promise<any>;
export declare function truncateAll(pool?: any): Promise<any>;
export declare function query(q: string, pool?: any): Promise<any>;
export declare function createFakeIterator(result: any[]): {
    next: () => any;
};
export declare function getFakeStoreAdapter({ readStub, readSinceStub, saveStub, lastEventOf, exists, }: {
    readStub?: any;
    readSinceStub?: any;
    saveStub?: (evt: any) => Promise<undefined>;
    lastEventOf?: (pattern: string) => Promise<Event<any, any>>;
    exists?: (id: string) => Promise<boolean>;
}): Promise<any>;
