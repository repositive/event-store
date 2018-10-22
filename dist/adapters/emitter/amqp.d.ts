import { EmitterAdapter, Logger } from '../../.';
export declare function wait(n: number): Promise<void>;
export declare function createAQMPEmitterAdapter(connectionString: string, logger?: Logger): EmitterAdapter;
