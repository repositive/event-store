import { EmitterAdapter, Logger, EventNamespace } from "../../.";
export interface IrisOptions {
    uri?: string;
    namespace: EventNamespace;
}
export declare function wait(n: number): Promise<void>;
export declare function createAQMPEmitterAdapter(irisOpts: IrisOptions, logger?: Logger): EmitterAdapter;
