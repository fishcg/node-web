/**
 * Minimal ambient types for `ali-oss`.
 *
 * ali-oss@6.x ships no TypeScript declarations. Only the surface used by
 * `lib/oss.ts` is declared here; extend it if more client methods are needed.
 */
declare module "ali-oss" {
  export interface Options {
    region?: string;
    bucket?: string;
    accessKeyId: string;
    accessKeySecret: string;
    secure?: boolean;
    endpoint?: string;
    timeout?: number;
  }

  export interface PutOptions {
    mime?: string;
    headers?: Record<string, string>;
  }

  export interface PutResult {
    name: string;
    url: string;
    res: { status: number };
  }

  export interface DeleteResult {
    res: { status: number };
  }

  export default class OSS {
    constructor(options: Options);
    put(name: string, file: Buffer | string, options?: PutOptions): Promise<PutResult>;
    delete(name: string): Promise<DeleteResult>;
  }
}
