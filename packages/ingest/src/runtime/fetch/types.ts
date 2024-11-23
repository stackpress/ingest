//common
import type { FetchRequest } from '../../types';
//local
import type Request from '../../Request';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// Fetch Types

export type FetchPayload = [ Request<FetchRequest>, Response<undefined> ];
export type FetchMap = Record<string, FetchPayload>;
export type FetchAction = (
  req: FetchPayload[0], 
  res: FetchPayload[1]
) => void | boolean | Promise<void|boolean>;