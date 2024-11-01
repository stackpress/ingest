//modules
import type { IncomingMessage, ServerResponse } from 'http';
//payload
import type Request from '../payload/Request';
import type Response from '../payload/Response';

export type IM = IncomingMessage;
export type SR = ServerResponse<IncomingMessage>;

export type HTTPPayload = [ Request<IM>, Response<SR> ];
export type HTTPMap = Record<string, HTTPPayload>;
export type HTTPAction = (req: HTTPPayload[0], res: HTTPPayload[1]) => void | boolean | Promise<void|boolean>;