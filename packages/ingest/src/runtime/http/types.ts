//common
import type { IM, SR } from '../../types';
import type Request from '../../Request';
import type Response from '../../Response';

//--------------------------------------------------------------------//
// HTTP Types

export type HTTPPayload = [ Request<IM>, Response<SR> ];
export type HTTPMap = Record<string, HTTPPayload>;
export type HTTPAction = (
  req: HTTPPayload[0], 
  res: HTTPPayload[1]
) => void | boolean | Promise<void|boolean>;
