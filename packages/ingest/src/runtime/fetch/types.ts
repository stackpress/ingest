//common
import type { FetchRequest } from '../../types';
import type Context from '../../Context';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// Fetch Types

export type FetchArgs = [ Context<FetchRequest>, Response<undefined> ];
export type FetchAction = (
  req: Context<FetchRequest>, 
  res: Response<undefined>
) => void | boolean | Promise<void|boolean>;