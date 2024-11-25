//common
import type { IM, SR } from '../../types';
import type Context from '../../Context';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// HTTP Types

export type HTTPArgs = [ Context<IM>, Response<SR> ];
export type HTTPAction = (
  req: Context<IM>, 
  res: Response<SR>
) => void | boolean | Promise<void|boolean>;
