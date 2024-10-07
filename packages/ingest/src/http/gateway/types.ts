import type { 
  Listener, 
  EventListener,
  ActionCallback 
} from '../../framework/types';

import type { IM, SR } from '../types';

export { IM, SR };

export type GatewayAction = ActionCallback<IM, SR>;
export type GatewayEventListener = EventListener<GatewayAction, IM, SR>;
export type GatewayListener = Listener<GatewayAction>;