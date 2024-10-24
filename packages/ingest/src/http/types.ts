//modules
import type { IncomingMessage, ServerResponse } from 'http';
//framework
import type { ActionCallback, ActionPayloadCallback } from '../framework/types';

export type IM = IncomingMessage;
export type SR = ServerResponse<IncomingMessage>;

export type ActionSet = Set<ActionPayloadCallback>;
export type HTTPAction = ActionCallback<IM, SR>;