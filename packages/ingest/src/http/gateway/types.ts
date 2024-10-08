import type { 
  Listener, 
  ActionCallback 
} from '../../framework/types';

import type { IM, SR } from '../types';

export { IM, SR };

export type GatewayAction = ActionCallback<IM, SR>;
export type GatewayListener = Listener<GatewayAction>;