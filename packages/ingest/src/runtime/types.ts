import type Context from '../Context';
import type Response from '../Response';

export type Action = (
  req: Context, 
  res: Response
) => void | boolean | Promise<void|boolean>;