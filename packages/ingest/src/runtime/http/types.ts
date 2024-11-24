//common
import type { IM, SR } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// HTTP Types

export type HTTPArgs<C = unknown> = [ Request<IM, C>, Response<SR> ];
export type HTTPAction<C = unknown> = (
  req: Request<IM, C>, 
  res: Response<SR>
) => void | boolean | Promise<void|boolean>;
