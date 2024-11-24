//common
import type { FetchRequest } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// Fetch Types

export type FetchArgs<C = unknown> = [ Request<FetchRequest, C>, Response<undefined> ];
export type FetchAction<C = unknown> = (
  req: Request<FetchRequest, C>, 
  res: Response<undefined>
) => void | boolean | Promise<void|boolean>;