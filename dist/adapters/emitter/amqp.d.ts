import { EmitterAdapter, Logger } from '../../.';
export interface IrisOptions {
    uri?: string;
    namespace: string;
}
export declare function wait(n: number): Promise<void>;
export declare function createAQMPEmitterAdapter(irisOpts: IrisOptions, logger?: Logger): EmitterAdapter;
