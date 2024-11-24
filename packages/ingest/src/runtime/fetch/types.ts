//common
import type { FetchRequest } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// Fetch Types

export type FetchArgs = [ Request<FetchRequest>, Response<undefined> ];
export type FetchAction = (
  req: Request<FetchRequest>, 
  res: Response<undefined>
) => void | boolean | Promise<void|boolean>;