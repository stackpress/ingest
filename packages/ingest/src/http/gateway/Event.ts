//framework
import FrameworkEvent from '../../framework/Event';
//gateway
import type { IM, SR, GatewayAction } from './types';

export default class Event extends FrameworkEvent<GatewayAction, IM, SR> {}