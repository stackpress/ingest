//common
import type { IM, SR } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// HTTP Types

export type HTTPArgs = [ Request<IM>, Response<SR> ];
export type HTTPAction = (
  req: Request<IM>, 
  res: Response<SR>
) => void | boolean | Promise<void|boolean>;
