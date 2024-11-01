import type Request from '@stackpress/ingest/dist/payload/Request';
import type Response from '@stackpress/ingest/dist/payload/Response';

export type FetchRequest = globalThis.Request;
export type FetchResponse = globalThis.Response;

export type FetchPayload = [ Request<FetchRequest>, Response<undefined> ];
export type FetchMap = Record<string, FetchPayload>;
export type FetchAction = (
  req: FetchPayload[0], 
  res: FetchPayload[1]
) => void | boolean | Promise<void|boolean>;